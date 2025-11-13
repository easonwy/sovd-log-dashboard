import { useLogStore } from '@/store/logStore';
import { LogFilters } from '@/types';

function encodeFilters(filters: LogFilters): string {
  const enabledLevels = Object.entries(filters.levels)
    .filter(([, on]) => on)
    .map(([k]) => k)
    .join(',');
  const enabledModules = Object.entries(filters.modules)
    .filter(([, on]) => on)
    .map(([k]) => k)
    .join(',');
  const params = new URLSearchParams();
  if (enabledLevels) params.set('levels', enabledLevels);
  if (enabledModules) params.set('modules', enabledModules);
  if (filters.searchText) params.set('searchText', filters.searchText);
  return params.toString();
}

const getSseUrl = (filters: LogFilters): string => {
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}/api/sse`
    : 'http://localhost:3000/api/sse';
  const qs = encodeFilters(filters);
  return qs ? `${base}?${qs}` : base;
};

class SSEService {
  private es: EventSource | null = null;

  public connect(filters: LogFilters) {
    // Avoid duplicate connections
    if (this.es && this.es.readyState !== EventSource.CLOSED) {
      return;
    }

    const url = getSseUrl(filters);
    try {
      this.es = new EventSource(url, { withCredentials: false });

      this.es.addEventListener('open', () => {
        useLogStore.getState().setConnectionStatus({ isConnected: true });
      });

      this.es.addEventListener('heartbeat', () => {
        // no-op: keeps the connection alive in some proxies
      });

      this.es.addEventListener('log', (evt: MessageEvent) => {
        try {
          const log = JSON.parse(evt.data);
          useLogStore.getState().addLog(log);
        } catch (err) {
          // Ignore malformed entries, but surface in dev consoles for visibility
          console.warn('[SSE] Failed to parse log event', err);
        }
      });

      this.es.onerror = () => {
        useLogStore.getState().setConnectionStatus({ isConnected: false, error: 'SSE connection error' });
        // Browser auto-reconnects EventSource; keep instance
      };
    } catch (err) {
      useLogStore.getState().setConnectionStatus({ isConnected: false, error: 'Failed to init SSE' });
      console.error('[SSE] Failed to initialize EventSource', err);
    }
  }

  public reconnect(filters: LogFilters) {
    this.disconnect();
    this.connect(filters);
  }

  public disconnect() {
    if (this.es) {
      try { this.es.close(); } catch (err) {
        // Closing errors are safe to ignore, but log at debug level
        console.debug('[SSE] Error closing EventSource (ignored)', err);
      }
      this.es = null;
    }
  }
}

export const sseService = new SSEService();