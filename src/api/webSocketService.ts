// src/api/webSocketService.ts

import { useLogStore } from '@/store/logStore';
import { LogFilters } from '@/types';
import { generateMockStreamLog } from './mockData'; // Import stream generator

// Get WebSocket URL from environment
const getWebSocketUrl = (): string => {
  const baseUrl = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WS_URL
    ? process.env.NEXT_PUBLIC_WS_URL
    : typeof window !== 'undefined'
      ? `ws://${window.location.host}`
      : 'ws://localhost:3000';
  return `${baseUrl}/api/ws`;
};

const FORCE_MOCK = process.env.NEXT_PUBLIC_FORCE_MOCK_API === 'true';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private mockStreamIntervalId: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  public connect(): void {
    // Immediately start mock stream if forced
    if (FORCE_MOCK) {
      console.warn('Forcing MOCK WebSocket stream.');
      this.startMockStream();
      return;
    }

    // Prevent creating multiple sockets during React Strict Mode remounts
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[WebSocket] Already connecting/connected, skipping connect. State:', this.ws.readyState);
      return;
    }

    // Clear any previous mock stream before attempting a real connection
    this.stopMockStream();

    const wsUrl = getWebSocketUrl();
    console.log('[WebSocket] Attempting to connect to:', wsUrl);
    try {
      this.ws = new WebSocket(wsUrl);
      console.log('[WebSocket] WebSocket object created, readyState:', this.ws.readyState);
      this.setupEventHandlers();
      console.log('[WebSocket] Event handlers set up');
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket instance:', error);
      this.handleConnectionFailure();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Only try to close if the WebSocket exists and is not already closing or closed.
    if (this.ws && this.ws.readyState < WebSocket.CLOSING) {
      this.ws.onclose = null; // Prevent onclose handler from firing on manual disconnect
      this.ws.close();
      console.log('WebSocket disconnected manually.');
    }
    this.ws = null;

    this.stopMockStream();
    console.log('Connection services stopped.');
  }

  public sendFilters(filters: LogFilters): void {
    console.log('[WS] sendFilters called, WS state:', this.ws?.readyState, 'readyState.OPEN=', WebSocket.OPEN);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = {
          type: 'filter',
          payload: filters,
        };
        console.log('[WS] Sending filters:', message);
        this.ws.send(JSON.stringify(message));
        console.log('[WS] Filters sent successfully');
      } catch (error) {
        console.error('[WS] Failed to send filters:', error);
        throw error;
      }
    } else {
      console.warn('[WS] Cannot send filters - WebSocket not open. State:', this.ws?.readyState);
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) {
      console.error('[WebSocket] No WebSocket object to setup handlers for');
      return;
    }

    console.log('[WebSocket] Setting up event handlers');

    this.ws.onopen = () => {
      console.log('[WebSocket] *** ONOPEN FIRED *** readyState:', this.ws?.readyState);
      try {
        console.log('[WebSocket] Accessing reconnectAttempts');
        this.reconnectAttempts = 0; // Reset reconnection counter
        console.log('[WebSocket] Getting store state');
        const store = useLogStore.getState();
        console.log('[WebSocket] Calling setConnectionStatus');
        store.setConnectionStatus({ isConnected: true });
        console.log('[WebSocket] Connection status set to connected');

        // Proactively sync current filters on connect to ensure server state is aligned
        try {
          this.sendFilters(store.filters);
        } catch (e) {
          console.warn('[WebSocket] Failed to send initial filters after open:', e);
        }
      } catch (error) {
        console.error('[WebSocket] Error in onopen handler:', error);
        throw error; // Re-throw to see if this causes the close
      }
    };

    this.ws.onmessage = (event) => {
      console.log('[WebSocket] *** ONMESSAGE FIRED ***');
      try {
        if (!event.data) {
          console.warn('[WS] Received empty message');
          return;
        }

        const message = JSON.parse(event.data);
        console.log('[WS] Message received, type:', message.type);
        
        // Handle different message types
        if (message.type === 'heartbeat') {
          console.log('[WS] Heartbeat received from server');
        } else if (message.type === 'log' && message.payload) {
          try {
            const log = message.payload;
            console.log('[WS] Adding log to store:', log.id);
            useLogStore.getState().addLog(log);
          } catch (storeError) {
            console.error('[WS] Error adding log to store:', storeError);
          }
        } else if (message.id && message.timestamp) {
          try {
            console.log('[WS] Adding legacy log to store:', message.id);
            useLogStore.getState().addLog(message);
          } catch (storeError) {
            console.error('[WS] Error adding legacy log to store:', storeError);
          }
        } else {
          console.log('[WS] Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('[WebSocket] Error in onmessage handler:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] *** ONERROR FIRED *** WebSocket error event:', error);
    };

    this.ws.onclose = (event) => {
      console.log('[WebSocket] *** ONCLOSE FIRED *** Connection closed, code:', event.code, 'reason:', event.reason, 'clean:', event.wasClean);
      this.ws = null;
      this.handleConnectionFailure();
    };

    console.log('[WebSocket] Event handlers attached successfully');
  }

  private handleConnectionFailure(): void {
    useLogStore.getState().setConnectionStatus({
      isConnected: false,
      error: 'WebSocket connection error. Check service status.',
    });

    // Attempt to reconnect with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.warn(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      this.reconnectTimeoutId = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      // After max reconnection attempts, fallback to mock stream as last resort
      console.error('Max reconnection attempts reached. WebSocket failed, using MOCK stream as fallback.');
      this.startMockStream();
    }
  }

  private startMockStream(): void {
    // Prevent multiple intervals
    if (this.mockStreamIntervalId) return;

    // Simulate a "connected" state for the UI, but it's mock.
    useLogStore.getState().setConnectionStatus({ isConnected: true });

    this.mockStreamIntervalId = setInterval(() => {
      const mockLog = generateMockStreamLog();
      useLogStore.getState().addLog(mockLog);
    }, 1200); // Generate a new log every 1.2 seconds
  }

  private stopMockStream(): void {
    if (this.mockStreamIntervalId) {
      clearInterval(this.mockStreamIntervalId);
      this.mockStreamIntervalId = null;
    }
  }
}

export const webSocketService = new WebSocketService();