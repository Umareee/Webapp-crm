// hooks/use-extension.ts
import { useState, useEffect, useCallback } from 'react';

/// <reference types="chrome"/>

interface ExtensionStatus {
  isInstalled: boolean;
  isConnected: boolean;
  version?: string;
}

interface BulkSendPayload {
  recipients: Array<{
    id: string;
    name: string;
    userId?: string;
    source: 'messenger' | 'facebook_group';
  }>;
  message: string;
  delay: number;
}

interface BulkSendProgress {
  isActive: boolean;
  currentIndex: number;
  totalCount: number;
  successCount: number;
  failureCount: number;
  startTime: number | null;
}

// Add chrome type check helper
const isChromeAvailable = (): boolean => {
  return typeof (window as any) !== 'undefined' && 
         typeof (window as any).chrome !== 'undefined' && 
         typeof (window as any).chrome.runtime !== 'undefined';
};

const isChromeMessagingAvailable = (): boolean => {
  return isChromeAvailable() && 
         typeof (window as any).chrome.runtime.sendMessage === 'function' &&
         typeof (window as any).chrome.runtime.onMessage !== 'undefined' &&
         typeof (window as any).chrome.runtime.onMessage.addListener === 'function' &&
         typeof (window as any).chrome.runtime.onMessage.removeListener === 'function';
};

export const useExtension = () => {
  const [status, setStatus] = useState<ExtensionStatus>({
    isInstalled: false,
    isConnected: false,
  });
  const [bulkSendProgress, setBulkSendProgress] = useState<BulkSendProgress | null>(null);

  // Check if extension is installed
  const checkExtensionStatus = useCallback(async () => {
    try {
      // Check if chrome is available
      if (!isChromeAvailable()) {
        setStatus({
          isInstalled: false,
          isConnected: false,
        });
        return;
      }

      // Check if chrome messaging is available
      if (!isChromeMessagingAvailable()) {
        setStatus({
          isInstalled: false,
          isConnected: false,
        });
        return;
      }

      // Try to ping the extension
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Extension timeout'));
        }, 2000);

        (window as any).chrome!.runtime.sendMessage(
          'ikadenoepdcldpfoenoibjdmdpjpkhhp', // Replace with your actual extension ID
          { type: 'PING' },
          (response: any) => {
            clearTimeout(timeout);
            if ((window as any).chrome!.runtime.lastError) {
              reject((window as any).chrome!.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      setStatus({
        isInstalled: true,
        isConnected: true,
        version: response?.version,
      });
    } catch (error) {
      setStatus({
        isInstalled: false,
        isConnected: false,
      });
    }
  }, []);

  // Send bulk campaign to extension
  const sendBulkCampaign = useCallback(async (payload: BulkSendPayload) => {
    if (!status.isInstalled || !isChromeMessagingAvailable()) {
      throw new Error('Extension not installed or messaging not available');
    }

    return new Promise<{ success: boolean; message?: string }>((resolve, reject) => {
      (window as any).chrome!.runtime.sendMessage(
        'ikadenoepdcldpfoenoibjdmdpjpkhhp',
        {
          type: 'BULK_SEND',
          payload: {
            recipients: payload.recipients,
            template: payload.message,
            delaySec: payload.delay,
          },
        },
        (response: any) => {
          if ((window as any).chrome!.runtime.lastError) {
            reject((window as any).chrome!.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });
  }, [status.isInstalled]);

  // Listen for progress updates from extension
  useEffect(() => {
    if (!status.isInstalled || !isChromeMessagingAvailable()) return;

    const handleMessage = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'BULK_PROGRESS_UPDATE') {
        setBulkSendProgress(message.progress);
      } else if (message.type === 'BULK_SEND_COMPLETE') {
        setBulkSendProgress(null);
        // Handle completion
      }
    };

    try {
      (window as any).chrome.runtime.onMessage.addListener(handleMessage);
      return () => {
        try {
          (window as any).chrome.runtime.onMessage.removeListener(handleMessage);
        } catch (error) {
          console.warn('[Extension Hook] Error removing message listener:', error);
        }
      };
    } catch (error) {
      console.warn('[Extension Hook] Error adding message listener:', error);
      return () => {}; // Return empty cleanup function
    }
  }, [status.isInstalled]);

  // Poll for progress updates if needed
  const pollProgress = useCallback(() => {
    if (!status.isInstalled || !isChromeMessagingAvailable()) return;

    const interval = setInterval(() => {
      (window as any).chrome!.runtime.sendMessage(
        'ikadenoepdcldpfoenoibjdmdpjpkhhp',
        { type: 'GET_BULK_PROGRESS' },
        (response: any) => {
          if (response?.progress) {
            setBulkSendProgress(response.progress);
            if (!response.progress.isActive) {
              clearInterval(interval);
            }
          }
        }
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [status.isInstalled]);

  // Cancel bulk send
  const cancelBulkSend = useCallback(async () => {
    if (!status.isInstalled || !isChromeMessagingAvailable()) return false;

    return new Promise<boolean>((resolve) => {
      ((window as any) as any).chrome!.runtime.sendMessage(
        'ikadenoepdcldpfoenoibjdmdpjpkhhp',
        { type: 'CANCEL_BULK_SEND' },
        (response: any) => {
          if (((window as any) as any).chrome!.runtime.lastError) {
            resolve(false);
          } else {
            const cancelled = response?.cancelled || false;
            if (cancelled) {
              setBulkSendProgress(null);
            }
            resolve(cancelled);
          }
        }
      );
    });
  }, [status.isInstalled]);

  useEffect(() => {
    checkExtensionStatus();
    // Recheck periodically
    const interval = setInterval(checkExtensionStatus, 5000);
    return () => clearInterval(interval);
  }, [checkExtensionStatus]);

  return {
    status,
    bulkSendProgress,
    checkExtensionStatus,
    sendBulkCampaign,
    cancelBulkSend,
    pollProgress,
  };
};