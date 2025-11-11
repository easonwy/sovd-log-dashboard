// src/hooks/useLogStream.ts

import { useEffect } from 'react';
import { useLogStore } from '@/store/logStore';
import { webSocketService } from '@/api/webSocketService';

/**
 * A custom hook to manage the entire lifecycle of the log data stream.
 * It handles the initial data fetch, WebSocket connection, filter synchronization,
 * and cleanup. This hook does not return anything; its purpose is to trigger
 * and manage side effects that update the global Zustand store.
 */
export const useLogStream = () => {
  // Select the necessary state from the store to use as dependencies for effects.
  // Using a selector function ensures the component only re-renders when these specific values change.
  const { viewMode, filters } = useLogStore(state => ({
    viewMode: state.viewMode,
    filters: state.filters,
  }));

  /**
   * Effect for initializing and cleaning up the data connection.
   * This runs only once when the component using the hook mounts.
   */
  useEffect(() => {
    // 1. Fetch the initial set of logs to populate the view.
    // In STREAM mode, this is the initial buffer. In HISTORY, it's the first page.
    useLogStore.getState().loadHistory(1);
    
    // 2. Establish the WebSocket connection.
    webSocketService.connect();

    // 3. Return a cleanup function that runs when the component unmounts.
    // This is crucial to prevent memory leaks and unnecessary background connections.
    return () => {
      webSocketService.disconnect();
    };
  }, []); // Empty dependency array means this effect runs only on mount and unmount.

  /**
   * Effect for synchronizing filters with the WebSocket server.
   * This runs whenever the filters or the view mode change.
   */
  useEffect(() => {
    // We only need to send filters to the WebSocket when in real-time stream mode.
    // In history mode, filters are applied via REST API requests.
    if (viewMode === 'STREAM') {
      webSocketService.sendFilters(filters);
    }
  }, [filters, viewMode]); // Dependencies: re-run this effect if filters or viewMode change.
};