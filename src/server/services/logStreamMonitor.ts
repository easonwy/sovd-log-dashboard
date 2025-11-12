import { executeQuery, isConnected } from '@/server/db/client';
import { rowToLogEntry, type LogRow } from '@/server/db/queries';
import { getWSService } from './wsService';

/**
 * Log Stream Monitor Service
 * 
 * Monitors the database for new log entries and broadcasts them
 * to all connected WebSocket clients in real-time.
 * 
 * Features:
 * - Polls database for new logs at configurable interval
 * - Tracks last seen log timestamp to identify new entries
 * - Broadcasts new logs to all connected clients
 * - Applies per-client filters before sending
 * - Handles database connection failures gracefully
 */
class LogStreamMonitor {
  private monitorIntervalId: NodeJS.Timeout | null = null;
  private lastTimestamp: string = new Date(Date.now() - 60000).toISOString(); // Start from 1 minute ago
  private readonly POLL_INTERVAL = 2000; // Poll every 2 seconds
  private isRunning = false;

  /**
   * Start monitoring the database for new logs
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[LogStreamMonitor] Monitor already running');
      return;
    }

    // Wrap in async IIFE to handle the async isConnected() call
    (async () => {
      if (!await isConnected()) {
        console.warn('[LogStreamMonitor] Database not connected, skipping monitor startup');
        return;
      }

      this.isRunning = true;
      console.log('[LogStreamMonitor] Starting log stream monitor');

      // Initial poll
      this.pollNewLogs();

      // Set up recurring poll
      this.monitorIntervalId = setInterval(() => {
        this.pollNewLogs();
      }, this.POLL_INTERVAL);
    })();
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.monitorIntervalId) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = null;
    }
    this.isRunning = false;
    console.log('[LogStreamMonitor] Log stream monitor stopped');
  }

  /**
   * Poll database for new logs since last check
   */
  private async pollNewLogs(): Promise<void> {
    // Check if monitor is running and database is connected
    if (!this.isRunning) {
      return;
    }

    try {
      const connected = await isConnected();
      if (!connected) {
        console.warn('[LogStreamMonitor] Database not connected, skipping poll');
        return;
      }

      const query = `
        SELECT id, timestamp, module, level, message, trace_id, details, create_time
        FROM infra_module_logs
        WHERE timestamp > ?
        ORDER BY timestamp ASC
        LIMIT 100
      `;

      const params = [this.lastTimestamp];
      const rows = await executeQuery<LogRow>(query, params);

      if (rows && rows.length > 0) {
        console.log(`[LogStreamMonitor] Found ${rows.length} new log entries`);

        // Update lastTimestamp to the latest log's timestamp
        const latestLog = rows[rows.length - 1];
        this.lastTimestamp = latestLog.timestamp;

        // Broadcast each new log to connected clients
        try {
          const wsService = getWSService();
          let broadcastCount = 0;
          
          rows.forEach((row) => {
            try {
              const logEntry = rowToLogEntry(row);
              wsService.broadcastLog(logEntry);
              broadcastCount++;
            } catch (error) {
              console.error('[LogStreamMonitor] Error converting row to log entry:', error);
            }
          });
          
          if (broadcastCount > 0) {
            console.log(`[LogStreamMonitor] Broadcasted ${broadcastCount} logs to connected clients`);
          }
        } catch (error) {
          console.error('[LogStreamMonitor] Error during broadcast:', error);
        }
      }
    } catch (error) {
      console.error('[LogStreamMonitor] Error polling for new logs:', error);
    }
  }

  /**
   * Get current monitor status
   */
  public getStatus(): {
    isRunning: boolean;
    lastTimestamp: string;
  } {
    return {
      isRunning: this.isRunning,
      lastTimestamp: this.lastTimestamp,
    };
  }
}

// Singleton instance
let logStreamMonitorInstance: LogStreamMonitor | null = null;

/**
 * Get or create LogStreamMonitor singleton
 */
export function getLogStreamMonitor(): LogStreamMonitor {
  if (!logStreamMonitorInstance) {
    logStreamMonitorInstance = new LogStreamMonitor();
  }
  return logStreamMonitorInstance;
}

export type { LogStreamMonitor };