/**
 * Browser Extension Integration Hook
 * 
 * This hook provides communication between the Next.js web application
 * and the Chrome browser extension. It manages extension status detection,
 * bulk messaging operations, and real-time progress tracking.
 * 
 * KEY FEATURES:
 * 1. Extension Detection - Checks if the Chrome extension is installed and connected
 * 2. Bulk Campaign Execution - Sends bulk messaging campaigns to the extension
 * 3. Progress Tracking - Real-time monitoring of campaign execution
 * 4. Error Handling - Robust error handling for extension communication
 * 5. Auto-reconnection - Periodic status checks and reconnection attempts
 * 
 * COMMUNICATION FLOW:
 * Web App → Chrome Extension → Facebook/Messenger Pages → Message Delivery
 * 
 * @author Messenger CRM Team
 * @version 3.0.0
 */

import { useState, useEffect, useCallback } from 'react';

/// <reference types="chrome"/>

/**
 * Extension connection and version information
 */
interface ExtensionStatus {
  isInstalled: boolean;  // Whether the extension is installed in the browser
  isConnected: boolean;  // Whether the extension is responding to messages
  version?: string;      // Extension version (if available)
}

/**
 * Payload structure for bulk messaging campaigns
 */
interface BulkSendPayload {
  recipients: Array<{
    id: string;                                      // Contact's unique identifier
    name: string;                                    // Contact's display name
    userId?: string;                                 // Facebook/Messenger user ID
    source: 'messenger' | 'facebook_group';         // Contact source platform
  }>;
  message: string;    // Message template to send (supports placeholders like {{name}})
  delay: number;      // Delay in seconds between messages (rate limiting)
}

/**
 * Real-time progress information for active bulk campaigns
 */
interface BulkSendProgress {
  isActive: boolean;      // Whether a campaign is currently running
  currentIndex: number;   // Current position in recipient list (0-based)
  totalCount: number;     // Total number of recipients
  successCount: number;   // Number of messages sent successfully
  failureCount: number;   // Number of messages that failed to send
  startTime: number | null; // Unix timestamp when campaign started
}

/* ===============================
   CHROME API DETECTION HELPERS
   ===============================*/

/**
 * Checks if Chrome extension APIs are available in the current environment
 * This is essential for SSR compatibility and extension feature detection
 * 
 * @returns true if Chrome extension APIs are available
 */
const isChromeAvailable = (): boolean => {
  console.log('[Extension Hook] Checking Chrome availability...');
  
  // Check if we're in a browser environment (not SSR)
  if (typeof (window as any) === 'undefined') {
    console.log('[Extension Hook] Window is undefined');
    return false;
  }
  
  // Check if Chrome object exists
  if (typeof (window as any).chrome === 'undefined') {
    console.log('[Extension Hook] chrome object is undefined');
    return false;
  }
  
  // Check if Chrome runtime API exists
  if (typeof (window as any).chrome.runtime === 'undefined') {
    console.log('[Extension Hook] chrome.runtime is undefined');
    return false;
  }
  
  console.log('[Extension Hook] Chrome is available');
  return true;
};

/**
 * Checks if Chrome messaging APIs are fully available for extension communication
 * Validates that all required messaging methods are present and functional
 * 
 * @returns true if Chrome messaging APIs are available and functional
 */
const isChromeMessagingAvailable = (): boolean => {
  console.log('[Extension Hook] Checking Chrome messaging availability...');
  
  // First check if basic Chrome APIs are available
  if (!isChromeAvailable()) {
    console.log('[Extension Hook] Chrome not available');
    return false;
  }
  
  const chrome = (window as any).chrome;
  
  // Check if sendMessage function exists
  if (typeof chrome.runtime.sendMessage !== 'function') {
    console.log('[Extension Hook] chrome.runtime.sendMessage is not a function');
    return false;
  }
  
  // Check if onMessage object exists
  if (typeof chrome.runtime.onMessage === 'undefined') {
    console.log('[Extension Hook] chrome.runtime.onMessage is undefined');
    return false;
  }
  
  // Check if message listener methods exist
  if (typeof chrome.runtime.onMessage.addListener !== 'function') {
    console.log('[Extension Hook] chrome.runtime.onMessage.addListener is not a function');
    return false;
  }
  
  if (typeof chrome.runtime.onMessage.removeListener !== 'function') {
    console.log('[Extension Hook] chrome.runtime.onMessage.removeListener is not a function');
    return false;
  }
  
  console.log('[Extension Hook] Chrome messaging API is available');
  return true;
};

export const useExtension = () => {
  const [status, setStatus] = useState<ExtensionStatus>({
    isInstalled: false,
    isConnected: false,
  });
  const [bulkSendProgress, setBulkSendProgress] = useState<BulkSendProgress | null>(null);

  // Check if extension is installed
  const checkExtensionStatus = useCallback(async () => {
    console.log('[Extension Hook] Starting extension status check...');
    
    try {
      // Check if chrome is available
      if (!isChromeAvailable()) {
        console.log('[Extension Hook] Chrome not available, setting status to not installed');
        setStatus({
          isInstalled: false,
          isConnected: false,
        });
        return;
      }

      // Check if chrome messaging is available
      if (!isChromeMessagingAvailable()) {
        console.log('[Extension Hook] Chrome messaging not available, setting status to not installed');
        setStatus({
          isInstalled: false,
          isConnected: false,
        });
        return;
      }

      console.log('[Extension Hook] Chrome APIs available, attempting to ping extension...');

      // Try to ping the extension
      const response = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('[Extension Hook] Ping timeout after 2 seconds');
          reject(new Error('Extension timeout'));
        }, 2000);

        console.log('[Extension Hook] Sending PING message to extension ID: ikadenoepdcldpfoenoibjdmdpjpkhhp');
        
        (window as any).chrome!.runtime.sendMessage(
          'ikadenoepdcldpfoenoibjdmdpjpkhhp', // Replace with your actual extension ID
          { type: 'PING' },
          (response: any) => {
            clearTimeout(timeout);
            
            const lastError = (window as any).chrome!.runtime.lastError;
            if (lastError) {
              console.log('[Extension Hook] Chrome runtime error:', lastError);
              reject(lastError);
            } else {
              console.log('[Extension Hook] Received PING response:', response);
              resolve(response);
            }
          }
        );
      });

      console.log('[Extension Hook] Extension ping successful, setting status to connected');
      setStatus({
        isInstalled: true,
        isConnected: true,
        version: response?.version,
      });
    } catch (error) {
      console.log('[Extension Hook] Extension check failed:', error);
      setStatus({
        isInstalled: false,
        isConnected: false,
      });
    }
  }, []);

  // Send bulk campaign to extension
  const sendBulkCampaign = useCallback(async (payload: BulkSendPayload) => {
    console.log('[Extension Hook] Starting bulk campaign with payload:', {
      recipientCount: payload.recipients.length,
      messagePreview: payload.message.substring(0, 50) + '...',
      delay: payload.delay
    });

    if (!status.isInstalled || !isChromeMessagingAvailable()) {
      console.error('[Extension Hook] Extension not available for bulk send');
      throw new Error('Extension not installed or messaging not available. Please install the Chrome extension to send bulk messages.');
    }

    return new Promise<{ success: boolean; message?: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[Extension Hook] Bulk send timeout');
        reject(new Error('Extension communication timeout. Please try again.'));
      }, 10000); // 10 second timeout

      try {
        (window as any).chrome!.runtime.sendMessage(
          'ikadenoepdcldpfoenoibjdmdpjpkhhp', // TODO: Make this configurable
          {
            type: 'BULK_SEND',
            payload: {
              recipients: payload.recipients,
              template: payload.message,
              delaySec: payload.delay,
            },
          },
          (response: any) => {
            clearTimeout(timeout);
            
            if ((window as any).chrome!.runtime.lastError) {
              const error = (window as any).chrome!.runtime.lastError;
              console.error('[Extension Hook] Chrome runtime error:', error);
              reject(new Error(`Extension communication failed: ${error.message}`));
              return;
            }

            if (!response) {
              console.error('[Extension Hook] No response from extension');
              reject(new Error('No response from extension. Please make sure the extension is active.'));
              return;
            }

            console.log('[Extension Hook] Bulk send response:', response);

            if (response.status === 'started') {
              resolve({ success: true, message: `Started sending to ${payload.recipients.length} recipients` });
            } else if (response.status === 'error') {
              reject(new Error(response.message || 'Failed to start bulk send'));
            } else {
              reject(new Error('Unexpected response from extension'));
            }
          }
        );
      } catch (error: any) {
        clearTimeout(timeout);
        console.error('[Extension Hook] Error sending message to extension:', error);
        reject(new Error(`Failed to communicate with extension: ${error.message}`));
      }
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
    console.log('[Extension Hook] Starting progress polling');
    if (!status.isInstalled || !isChromeMessagingAvailable()) {
      console.warn('[Extension Hook] Cannot poll progress - extension not available');
      return () => {};
    }

    const interval = setInterval(() => {
      try {
        (window as any).chrome!.runtime.sendMessage(
          'ikadenoepdcldpfoenoibjdmdpjpkhhp',
          { type: 'GET_BULK_PROGRESS' },
          (response: any) => {
            if ((window as any).chrome!.runtime.lastError) {
              console.warn('[Extension Hook] Progress poll error:', (window as any).chrome!.runtime.lastError);
              return;
            }

            if (response?.progress) {
              console.log('[Extension Hook] Progress update:', response.progress);
              setBulkSendProgress(response.progress);
              if (!response.progress.isActive) {
                console.log('[Extension Hook] Bulk send completed, stopping polling');
                clearInterval(interval);
                setBulkSendProgress(null); // Clear progress after completion
              }
            }
          }
        );
      } catch (error) {
        console.error('[Extension Hook] Error polling progress:', error);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds instead of 1 second

    return () => {
      console.log('[Extension Hook] Stopping progress polling');
      clearInterval(interval);
    };
  }, [status.isInstalled]);

  // Cancel bulk send
  const cancelBulkSend = useCallback(async () => {
    console.log('[Extension Hook] Attempting to cancel bulk send');
    if (!status.isInstalled || !isChromeMessagingAvailable()) {
      console.error('[Extension Hook] Cannot cancel - extension not available');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.error('[Extension Hook] Cancel timeout');
        resolve(false);
      }, 5000);

      (window as any).chrome!.runtime.sendMessage(
        'ikadenoepdcldpfoenoibjdmdpjpkhhp',
        { type: 'CANCEL_BULK_SEND' },
        (response: any) => {
          clearTimeout(timeout);
          
          if ((window as any).chrome!.runtime.lastError) {
            console.error('[Extension Hook] Cancel error:', (window as any).chrome!.runtime.lastError);
            resolve(false);
            return;
          }

          console.log('[Extension Hook] Cancel response:', response);
          const cancelled = response?.cancelled || false;
          if (cancelled) {
            setBulkSendProgress(null); // Clear progress when cancelled
          }
          resolve(cancelled);
        }
      );
    });
  }, [status.isInstalled]);

  // Start polling when bulk send begins
  useEffect(() => {
    if (bulkSendProgress?.isActive) {
      const cleanup = pollProgress();
      return cleanup;
    }
  }, [bulkSendProgress?.isActive, pollProgress]);

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