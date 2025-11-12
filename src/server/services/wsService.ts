import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { LogFilters, LogEntry } from '@/types';

/**
 * WebSocket message types
 */
interface WebSocketMessage {
  type: 'filter' | 'heartbeat' | 'subscribe' | 'unsubscribe' | 'log';
  payload?: Record<string, unknown> | LogEntry | { message: string; clientId: string; timestamp: number } | { timestamp: number } | { status: string; clientId?: string };
  timestamp?: number;
}

/**
 * Client session tracking
 */
interface ClientSession {
  id: string;
  filters: LogFilters;
  lastHeartbeat: number;
}

/**
 * WebSocket Service for Real-Time Log Streaming
 *
 * Handles:
 * - Server-side WebSocket connections
 * - Client session management
 * - Filter state per client
 * - Heartbeat/keep-alive
 * - Broadcasting filtered logs
 * - Memory management and cleanup
 *
 * Architecture:
 * - Single WSService instance per server
 * - Multiple client sessions (one per connected browser)
 * - Each client has independent filter state
 * - Logs are filtered before sending to reduce bandwidth
 */
export class WSService {
  private wss: Server | null = null;
  private clients: Map<WebSocket, ClientSession> = new Map();
  private clientIdCounter = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 60000; // 60 seconds

  /**
   * Initialize WebSocket server
   * Called once during server startup
   */
  public initialize(wss: Server): void {
    if (this.wss) {
      console.warn('WSService already initialized');
      return;
    }

    this.wss = wss;
    this.setupConnectionHandler();
    this.startHeartbeat();
    console.log('WebSocket service initialized');
  }

  /**
   * Handle new WebSocket connections
   */
  private setupConnectionHandler(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      const clientIp = this.getClientIp(req);

      console.log(`[WS] Client connected: ${clientId} from ${clientIp}`);

      // Initialize client session
      const session: ClientSession = {
        id: clientId,
        filters: this.getDefaultFilters(),
        lastHeartbeat: Date.now(),
      };

      this.clients.set(ws, session);

      // Setup event handlers for this client
      this.setupClientHandlers(ws, session);

      // Send initial welcome message
      this.send(ws, {
        type: 'heartbeat',
        payload: {
          message: 'Connected to log stream',
          clientId,
          timestamp: Date.now(),
        },
      });
    });
  }

  /**
   * Setup event handlers for individual client
   */
  private setupClientHandlers(ws: WebSocket, session: ClientSession): void {
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleClientMessage(ws, session, message);
      } catch (error) {
        console.error(`[WS] Failed to parse message from ${session.id}:`, error);
      }
    });

    ws.on('error', (error: Error) => {
      console.error(`[WS] Error from client ${session.id}:`, error);
    });

    ws.on('close', () => {
      console.log(`[WS] Client disconnected: ${session.id}`);
      this.clients.delete(ws);
    });

    ws.on('pong', () => {
      session.lastHeartbeat = Date.now();
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleClientMessage(
    ws: WebSocket,
    session: ClientSession,
    message: WebSocketMessage
  ): void {
    switch (message.type) {
      case 'filter':
        // Client sending new filter state
        if (message.payload) {
          session.filters = { ...session.filters, ...message.payload };
          console.log(`[WS] Updated filters for ${session.id}:`, session.filters);
        }
        break;

      case 'heartbeat':
        // Client heartbeat
        session.lastHeartbeat = Date.now();
        this.send(ws, {
          type: 'heartbeat',
          payload: { timestamp: Date.now() },
        });
        break;

      case 'subscribe':
        // Client wants to start receiving logs
        console.log(`[WS] Client ${session.id} subscribed`);
        this.send(ws, {
          type: 'subscribe',
          payload: { status: 'subscribed', clientId: session.id },
        });
        break;

      case 'unsubscribe':
        // Client wants to stop receiving logs
        console.log(`[WS] Client ${session.id} unsubscribed`);
        this.send(ws, {
          type: 'unsubscribe',
          payload: { status: 'unsubscribed' },
        });
        break;

      default:
        console.warn(`[WS] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Broadcast a new log to all connected clients
   * Applies client-specific filters before sending
   *
   * This method is called by the server when a new log arrives
   * (e.g., from log ingestion endpoint or queue)
   */
  public broadcastLog(log: LogEntry): void {
    if (this.clients.size === 0) return;

    // Iterate through all connected clients
    for (const [ws, session] of this.clients.entries()) {
      // Apply client's filter to log
      if (this.matchesFilters(log, session.filters)) {
        this.send(ws, {
          type: 'log',
          payload: log,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Broadcast logs to all connected clients
   * Useful for bulk operations or stats updates
   */
  public broadcastLogs(logs: LogEntry[]): void {
    logs.forEach((log) => this.broadcastLog(log));
  }

  /**
   * Check if a log matches a client's filter criteria
   */
  private matchesFilters(log: LogEntry, filters: LogFilters): boolean {
    // Filter by log level
    // levels is a Record<string, boolean> where key is the level name
    const enabledLevels = Object.entries(filters.levels)
      .filter(([, enabled]) => enabled)
      .map(([level]) => level);

    if (enabledLevels.length > 0) {
      if (!enabledLevels.includes(log.level)) {
        return false;
      }
    }

    // Filter by module
    // modules is a Record<string, boolean> where key is the module name
    const enabledModules = Object.entries(filters.modules)
      .filter(([, enabled]) => enabled)
      .map(([module]) => module);

    if (enabledModules.length > 0) {
      if (!enabledModules.includes(log.module)) {
        return false;
      }
    }

    // Filter by search text (message or trace ID)
    if (filters.searchText && filters.searchText.trim().length > 0) {
      const searchLower = filters.searchText.toLowerCase();
      const messageMatch = log.message.toLowerCase().includes(searchLower);
      const traceMatch = log.traceId.toLowerCase().includes(searchLower);

      if (!messageMatch && !traceMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Send message to a specific client
   */
  private send(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WS] Failed to send message:', error);
      }
    }
  }

  /**
   * Start heartbeat interval to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const deadClients: WebSocket[] = [];

      // Check for stale connections
      for (const [ws, session] of this.clients.entries()) {
        const timeSinceLastHeartbeat = now - session.lastHeartbeat;

        if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT) {
          // Connection is dead
          console.warn(`[WS] Timeout: client ${session.id} (${timeSinceLastHeartbeat}ms)`);
          deadClients.push(ws);
        } else if (ws.readyState === WebSocket.OPEN) {
          // Send ping to client
          ws.ping();
        }
      }

      // Close dead connections
      deadClients.forEach((ws) => {
        try {
          ws.close(1000, 'Heartbeat timeout');
        } catch (error) {
          console.error('[WS] Error closing dead connection:', error);
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Cleanup WebSocket service
   * Called on server shutdown
   */
  public shutdown(): void {
    // Close all client connections
    for (const [ws, session] of this.clients.entries()) {
      console.log(`[WS] Closing connection for ${session.id}`);
      ws.close(1001, 'Server shutting down');
    }

    this.clients.clear();

    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    console.log('[WS] WebSocket service shut down');
  }

  /**
   * Get current client count
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get statistics about connected clients
   */
  public getStats(): {
    clientCount: number;
    clients: Array<{
      id: string;
      filters: LogFilters;
      lastHeartbeat: number;
    }>;
  } {
    const clients = Array.from(this.clients.values());
    return {
      clientCount: clients.length,
      clients,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateClientId(): string {
    return `client-${++this.clientIdCounter}-${Date.now()}`;
  }

  private getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private getDefaultFilters(): LogFilters {
    return {
      levels: {},
      modules: {},
      searchText: '',
    };
  }
}

// Singleton instance
let wsServiceInstance: WSService | null = null;

/**
 * Get or create WSService singleton
 */
export function getWSService(): WSService {
  if (!wsServiceInstance) {
    wsServiceInstance = new WSService();
  }
  return wsServiceInstance;
}
