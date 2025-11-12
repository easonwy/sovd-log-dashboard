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
  return `${baseUrl}/ws/logs`;
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

    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    // Clear any previous mock stream before attempting a real connection
    this.stopMockStream();

    const wsUrl = getWebSocketUrl();
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket instance:', error);
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(
          JSON.stringify({
            type: 'filter',
            payload: filters,
          })
        );
      } catch (error) {
        console.error('Failed to send filters:', error);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Real WebSocket connection established.');
      this.reconnectAttempts = 0; // Reset reconnection counter
      useLogStore.getState().setConnectionStatus({ isConnected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        useLogStore.getState().addLog(log);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };

    this.ws.onclose = () => {
      console.log('Real WebSocket connection closed.');
      this.handleConnectionFailure();
    };
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
      // After max reconnection attempts, fallback to mock stream
      console.warn('Max reconnection attempts reached. Starting MOCK data stream as a fallback.');
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