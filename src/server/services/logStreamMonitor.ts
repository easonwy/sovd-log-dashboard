// Use relative imports so this file works when loaded directly by Node (ts-node)
// The alias '@' is resolved by Next.js, but not by the custom server runtime.
import { executeQuery, isConnected } from '../db/client';
import { rowToLogEntry, type LogRow } from '../db/queries';
import eventBus from './eventBus';

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
  // Use create_time as the cursor
  // Initialize 10 minutes back to catch recent manual inserts
  private lastCreateTime: string = LogStreamMonitor.toSqlDateTime(new Date(Date.now() - 10 * 60 * 1000));
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
        WHERE create_time > ?
        ORDER BY create_time ASC
        LIMIT 100
      `;

      const params = [this.lastCreateTime];

      

      const rows = await executeQuery<LogRow>(query, params);

      console.log(`[LogStreamMonitor] Result count: ${rows ? rows.length : 0}`);

      if (rows && rows.length > 0) {
        console.log(`[LogStreamMonitor] Found ${rows.length} new log entries`);

        // Advance the cursor to the latest row's create_time
        const latestLog = rows[rows.length - 1];
        this.lastCreateTime = latestLog.create_time;

        // Broadcast each new log to connected clients via event bus
        try {
          let broadcastCount = 0;
          
          rows.forEach((row) => {
            try {
              const logEntry = rowToLogEntry(row);
              eventBus.emit('log', logEntry);
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
    lastCreateTime: string;
  } {
    return {
      isRunning: this.isRunning,
      lastCreateTime: this.lastCreateTime,
    };
  }

  // Format a JS Date to MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
  private static toSqlDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  // Best-effort SQL formatter that replaces '?' with MySQL-safe literals
  private static formatSql(sql: string, params: (string | number | null)[]): string {
    let i = 0;
    return sql.replace(/\?/g, () => {
      const p = params[i++];
      return LogStreamMonitor.toSqlLiteral(p);
    });
  }

  private static toSqlLiteral(value: string | number | null): string {
    if (value === null) return 'NULL';
    if (typeof value === 'number') return String(value);
    const s = String(value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
    return `'${s}'`;
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