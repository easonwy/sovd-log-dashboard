import { useEffect, useRef, useCallback } from 'react';
import { useLogStore } from '@/store/logStore';
import { webSocketService } from '@/api/webSocketService';

/**
 * A custom hook to manage the entire lifecycle of the log data stream.
 * It handles the initial data fetch, WebSocket connection, filter synchronization,
 * and cleanup. This hook does not return anything; its purpose is to trigger
 * and manage side effects that update the global Zustand store.
 */
export const useLogStream = () => {
  // Use stable selectors to avoid infinite loops with useSyncExternalStore
  // Each selector should be created only once and cached
  const viewMode = useLogStore(useCallback(state => state.viewMode, []));
  const filters = useLogStore(useCallback(state => state.filters, []));

  // Use a ref to track if initialization has already run.
  const initialized = useRef(false);

  /**
   * Effect for initializing and cleaning up the data connection.
   * This runs only once when the component using the hook mounts.
   */
  useEffect(() => {

    // Only run initialization logic ONCE.
    if (!initialized.current) {
      initialized.current = true; // Mark as initialized

      console.log('Initializing log stream and connection...');
      
      // 1. Fetch the initial set of logs.
      useLogStore.getState().loadHistory(1);
      
      // 2. Establish the WebSocket connection.
      webSocketService.connect();
    }

    // 3. Return a cleanup function that runs when the component unmounts.
    // This is crucial to prevent memory leaks and unnecessary background connections.
    return () => {
      // In React Strict Mode (development), components mount, unmount, then mount again.
      // Ensure we close any in-flight socket to avoid duplicate connections.
      if (initialized.current) {
        webSocketService.disconnect();
        initialized.current = false;
      }
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
  
  /**
   * Effect for loading history when view mode changes.
   * This runs whenever the view mode changes.
   */
  useEffect(() => {
    // Only load history if we're in HISTORY mode
    if (viewMode === 'HISTORY') {
      useLogStore.getState().loadHistory(1);
    }
  }, [viewMode]);
};