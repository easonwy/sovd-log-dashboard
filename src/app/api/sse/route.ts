import eventBus from '@/server/services/eventBus';
import { getLogStreamMonitor } from '@/server/services/logStreamMonitor';
import { LogEntry, LogFilters } from '@/types';

// Parse CSV query params into arrays
function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildFilters(url: URL): LogFilters {
  const levels = parseCsv(url.searchParams.get('levels'));
  const modules = parseCsv(url.searchParams.get('modules'));
  const searchText = url.searchParams.get('searchText') || '';

  // Convert arrays into the { [key]: boolean } shape
  const levelsMap: Record<string, boolean> = {};
  for (const l of levels) levelsMap[l] = true;
  const modulesMap: Record<string, boolean> = {};
  for (const m of modules) modulesMap[m] = true;

  return {
    levels: levelsMap,
    modules: modulesMap,
    searchText,
  };
}

function matchesFilters(log: LogEntry, filters: LogFilters): boolean {
  const enabledLevels = Object.entries(filters.levels)
    .filter(([, enabled]) => enabled)
    .map(([level]) => level);
  if (enabledLevels.length > 0 && !enabledLevels.includes(log.level)) return false;

  const enabledModules = Object.entries(filters.modules)
    .filter(([, enabled]) => enabled)
    .map(([module]) => module);
  if (enabledModules.length > 0 && !enabledModules.includes(log.module)) return false;

  if (filters.searchText && filters.searchText.trim()) {
    const s = filters.searchText.toLowerCase();
    const messageMatch = log.message.toLowerCase().includes(s);
    const eventMatch = log.eventId.toLowerCase().includes(s);
    if (!messageMatch && !eventMatch) return false;
  }
  return true;
}

export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const filters = buildFilters(url);

  // Ensure the LogStreamMonitor is running in environments where the custom server isn't used
  try {
    const monitor = getLogStreamMonitor();
    const status = monitor.getStatus();
    if (!status.isRunning) {
      monitor.start();
      console.log('[SSE] Started LogStreamMonitor from /api/sse route');
    }
  } catch (e) {
    console.warn('[SSE] Could not start LogStreamMonitor:', (e as Error).message);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial ack and keepalive timer
      send('open', { status: 'ok' });
      const keepalive = setInterval(() => {
        controller.enqueue(encoder.encode(`event: heartbeat\n`));
        controller.enqueue(encoder.encode(`data: {}\n\n`));
      }, 15000);

      const onLog = (log: LogEntry) => {
        try {
          if (matchesFilters(log, filters)) {
            send('log', log);
          }
        } catch (err) {
          // Don't break the stream on individual errors
          console.warn('[SSE] Failed to send log event', err);
        }
      };
      eventBus.on('log', onLog);

      // Cleanup on client disconnect
      const abort: AbortSignal | undefined = req.signal as AbortSignal | undefined;
      const cleanup = () => {
        clearInterval(keepalive);
        eventBus.off('log', onLog);
        try { controller.close(); } catch (e) {
          // Ignore close errors, stream may already be closed by the client
          console.debug('[SSE] Controller close error (ignored)', e);
        }
      };
      if (abort) {
        abort.addEventListener('abort', cleanup, { once: true });
      }
    },
    cancel() {
      // Reader cancelled
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Allow browser to keep the connection open
      'X-Accel-Buffering': 'no',
      // Simple CORS for local testing
      'Access-Control-Allow-Origin': '*',
    },
  });
};