// hooks/use-sync.ts
import { useEffect, useCallback, useState } from 'react';

export interface SyncStatus {
  isConnected: boolean;
  lastSync: Date | null;
  error: string | null;
}

export function useSync() {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkSyncStatus = useCallback(async (): Promise<SyncStatus> => {
    if (!isClient) {
      return { isConnected: false, lastSync: null, error: 'Server side rendering' };
    }

    try {
      // Dynamic import to avoid SSR issues
      const { extensionSyncService } = await import('../lib/extension-service');
      const isConnected = await extensionSyncService.isExtensionConnected();
      return {
        isConnected,
        lastSync: isConnected ? new Date() : null,
        error: null
      };
    } catch (error) {
      return {
        isConnected: false,
        lastSync: null,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }, [isClient]);

  const initializeSync = useCallback(async () => {
    if (!isClient) {
      return () => {}; // No-op cleanup for SSR
    }

    try {
      // Dynamic import to avoid SSR issues
      const { extensionSyncService } = await import('../lib/extension-service');
      const isConnected = await extensionSyncService.isExtensionConnected();
      
      if (isConnected) {
        console.log('[Sync] Extension connected, initializing bidirectional sync');
        
        // Set up listeners for extension data changes
        const cleanup = extensionSyncService.onExtensionDataChange((data) => {
          console.log('[Sync] Received data change from extension:', data.type);
        });
        
        return cleanup;
      } else {
        console.log('[Sync] Extension not connected, using local storage only');
        return () => {}; // No cleanup needed
      }
    } catch (error) {
      console.error('[Sync] Failed to initialize sync:', error);
      return () => {};
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;

    let cleanup = () => {};
    
    initializeSync().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return cleanup;
  }, [initializeSync, isClient]);

  return {
    checkSyncStatus,
    initializeSync
  };
}