// src/api/webSocketService.ts

import { BACKEND_URL } from '@/constants/logConstants';
import { useLogStore } from '@/store/logStore';
import { LogFilters } from '@/types';
import { generateMockStreamLog } from './mockData'; // Import stream generator

const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK_API === 'true';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeoutId: number | null = null;
  private mockStreamIntervalId: number | null = null;

  public connect(): void {
    // Immediately start mock stream if forced
    if (FORCE_MOCK) {
        console.warn("Forcing MOCK WebSocket stream.");
        this.startMockStream();
        return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    // Clear any previous mock stream before attempting a real connection
    this.stopMockStream();

    const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws/logs';
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
    // In mock mode, filtering is done client-side, so this does nothing.
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // ... (sendFilters logic is unchanged)
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Real WebSocket connection established.');
      useLogStore.getState().setConnectionStatus({ isConnected: true });
    };

    this.ws.onmessage = (event) => { /* ... unchanged ... */ };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };

    this.ws.onclose = () => {
      console.log('Real WebSocket connection closed.');
      this.handleConnectionFailure(); // Fallback to mock or attempt reconnect
    };
  }
  
  private handleConnectionFailure(): void {
    useLogStore.getState().setConnectionStatus({
        isConnected: false,
        error: 'WebSocket connection error. Check service status.',
    });
    
    // Fallback to mock stream instead of retrying connection.
    // This provides a better developer experience when the backend is known to be down.
    console.warn("WebSocket connection failed. Starting MOCK data stream as a fallback.");
    this.startMockStream();
  }

  private startMockStream(): void {
    // Prevent multiple intervals
    if (this.mockStreamIntervalId) return;

    // Simulate a "connected" state for the UI, but it's mock.
    useLogStore.getState().setConnectionStatus({ isConnected: true });

    this.mockStreamIntervalId = window.setInterval(() => {
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