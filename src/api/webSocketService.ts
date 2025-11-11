// src/api/webSocketService.ts

import { BACKEND_URL, LOG_LEVELS, LOG_MODULES } from '@/constants/logConstants';
import { useLogStore } from '@/store/logStore';
import { LogFilters } from '@/types';

/**
 * Manages the WebSocket connection for real-time log streaming.
 * This service is a singleton, ensuring only one connection exists for the app.
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeoutId: number | null = null;

  /**
   * Establishes a connection to the WebSocket server.
   * If already connected, it does nothing.
   */
  public connect(): void {
    // Prevent multiple connections
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws/logs';
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket instance:', error);
      useLogStore.getState().setConnectionStatus({
        isConnected: false,
        error: 'Failed to initialize WebSocket connection.',
      });
    }
  }

  /**
   * Closes the WebSocket connection and prevents automatic reconnection.
   */
  public disconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent onclose handler from firing on manual disconnect
      this.ws.close();
      this.ws = null;
      console.log('WebSocket disconnected manually.');
    }
  }

  /**
   * Sends the current filter state to the server for server-side filtering.
   * @param filters - The current log filters.
   */
  public sendFilters(filters: LogFilters): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        levels: LOG_LEVELS.filter(l => filters.levels[l]),
        modules: LOG_MODULES.filter(m => filters.modules[m]),
        searchText: filters.searchText,
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Sets up the event handlers for the WebSocket instance.
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connection established.');
      useLogStore.getState().setConnectionStatus({ isConnected: true });
      // On successful connection, send the initial filters
      this.sendFilters(useLogStore.getState().filters);
    };

    this.ws.onmessage = (event) => {
      try {
        const newLog = JSON.parse(event.data);
        // The addLog action in the store will handle the logic for pause/viewMode
        useLogStore.getState().addLog(newLog);
      } catch (e) {
        console.error('Failed to parse incoming WebSocket message:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      useLogStore.getState().setConnectionStatus({
        isConnected: false,
        error: 'WebSocket connection error. Check service status.',
      });
      this.ws?.close(); // Ensure connection is closed on error
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed.');
      useLogStore.getState().setConnectionStatus({ isConnected: false });
      
      // Automatic reconnection logic
      if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = window.setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        this.connect();
      }, 3000);
    };
  }
}

// Export a single instance to be used throughout the application
export const webSocketService = new WebSocketService();