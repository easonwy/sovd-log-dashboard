import { useEffect, useRef, useCallback } from 'react';
import { useLogStore } from '@/store/logStore';
import { sseService } from '@/api/sseService';

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

      // 2. Establish the SSE connection with current filters when in STREAM mode.
      if (useLogStore.getState().viewMode === 'STREAM') {
        sseService.connect(useLogStore.getState().filters);
      }
    }

    // 3. Return a cleanup function that runs when the component unmounts.
    // This is crucial to prevent memory leaks and unnecessary background connections.
    return () => {
      // In React Strict Mode (development), components mount, unmount, then mount again.
      // Ensure we close any in-flight socket to avoid duplicate connections.
      if (initialized.current) {
        sseService.disconnect();
        initialized.current = false;
      }
    };
  }, []); // Empty dependency array means this effect runs only on mount and unmount.

  /**
   * Effect for synchronizing stream with current filters and mode.
   * Reconnects SSE when filters change in STREAM mode; loads history in HISTORY mode.
   */
  useEffect(() => {
    if (viewMode === 'STREAM') {
      sseService.reconnect(filters);
    } else {
      // In history mode, filters applied via REST
      useLogStore.getState().loadHistory(1);
      // Also ensure stream is disconnected
      sseService.disconnect();
    }
  }, [filters, viewMode]);
  
  /**
   * Effect for loading history when view mode changes.
   * This runs whenever the view mode changes.
   */
  useEffect(() => {
    if (viewMode === 'HISTORY') {
      useLogStore.getState().loadHistory(1);
    }
  }, [viewMode]);
};