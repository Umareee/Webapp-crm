// lib/extension-detector.ts
import { useState, useEffect, useCallback } from 'react';

/// <reference types="chrome"/>

interface DetectedExtension {
  id: string;
  name: string;
  version: string;
}

// Add chrome type check helper
const isChromeAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.chrome !== 'undefined' && 
         typeof window.chrome.runtime !== 'undefined';
};

class ExtensionDetector {
  private knownExtensionNames = [
    'Mini CRM - Firebase Edition',
    'Messenger CRM Pro',
    'Facebook Messenger CRM'
  ];

  /**
   * Detect extension by trying common methods
   */
  async detectExtension(): Promise<DetectedExtension | null> {
    // Method 1: Try to inject a detection script
    try {
      const detected = await this.injectDetectionScript();
      if (detected) return detected;
    } catch (error) {
      console.log('[ExtensionDetector] Injection method failed:', error);
    }

    // Method 2: Try known extension IDs (you should replace these with your actual ID)
    const knownIds = [
      'ikadenoepdcldpfoenoibjdmdpjpkhhp',
      // Add other possible IDs if you have multiple versions
    ];

    for (const id of knownIds) {
      try {
        const result = await this.pingExtension(id);
        if (result) return result;
      } catch (error) {
        console.log(`[ExtensionDetector] Failed to ping ${id}:`, error);
      }
    }

    // Method 3: Try to communicate with content script
    try {
      const detected = await this.detectViaContentScript();
      if (detected) return detected;
    } catch (error) {
      console.log('[ExtensionDetector] Content script detection failed:', error);
    }

    return null;
  }

  private async injectDetectionScript(): Promise<DetectedExtension | null> {
    return new Promise((resolve) => {
      // Create a script element that will be injected into the page
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Try to access extension info
            try {
              const extensions = [];
              // This won't work in newer Chrome versions due to security restrictions
              // But we can try other methods
              window.postMessage({
                type: 'EXTENSION_DETECTION_RESULT',
                extensions: extensions
              }, '*');
            } catch (e) {
              window.postMessage({
                type: 'EXTENSION_DETECTION_RESULT',
                extensions: []
              }, '*');
            }
          }
        })();
      `;

      const messageHandler = (event: MessageEvent) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'EXTENSION_DETECTION_RESULT') {
          window.removeEventListener('message', messageHandler);
          document.head.removeChild(script);
          
          // Process results (this method has limited success in modern browsers)
          resolve(null);
        }
      };

      window.addEventListener('message', messageHandler);
      document.head.appendChild(script);

      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        if (script.parentNode) {
          document.head.removeChild(script);
        }
        resolve(null);
      }, 2000);
    });
  }

  private async pingExtension(extensionId: string): Promise<DetectedExtension | null> {
    if (!isChromeAvailable()) {
      return null;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 2000);

      try {
        window.chrome!.runtime.sendMessage(extensionId, { type: 'PING' }, (response: any) => {
          clearTimeout(timeout);
          
          if (window.chrome!.runtime.lastError) {
            resolve(null);
          } else if (response && response.type === 'PONG') {
            resolve({
              id: extensionId,
              name: response.name || 'Unknown Extension',
              version: response.version || 'Unknown'
            });
          } else {
            resolve(null);
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  }

  private async detectViaContentScript(): Promise<DetectedExtension | null> {
    return new Promise((resolve) => {
      // Look for signs that our extension's content script is active
      const checkSigns = () => {
        // Check for elements that our extension creates
        const extensionElements = [
          document.querySelector('#groups-crm-buttons'),
          document.querySelector('.crm-check'),
          document.querySelector('.groups-crm-checkbox')
        ].filter(Boolean);

        if (extensionElements.length > 0) {
          // Extension appears to be active
          resolve({
            id: 'detected-via-content-script',
            name: 'CRM Extension (detected)',
            version: 'unknown'
          });
        } else {
          resolve(null);
        }
      };

      // Check immediately and after a short delay
      checkSigns();
      setTimeout(checkSigns, 1000);
      setTimeout(() => resolve(null), 3000); // Final timeout
    });
  }

  /**
   * Get extension ID from Chrome Web Store URL
   * This can be used during development/setup
   */
  extractIdFromUrl(webStoreUrl: string): string | null {
    const match = webStoreUrl.match(/\/detail\/[^/]+\/([a-z]{32})/);
    return match ? match[1] : null;
  }

  /**
   * Generate installation instructions
   */
  getInstallationInstructions(): {
    chromeWebStoreUrl: string;
    steps: string[];
  } {
    return {
      chromeWebStoreUrl: 'https://chrome.google.com/webstore/detail/your-extension-id', // Replace with actual URL
      steps: [
        'Click "Add to Chrome" on the extension page',
        'Grant the required permissions when prompted',
        'Look for the extension icon in your browser toolbar',
        'Sign in to the extension with your account',
        'Return to this page and refresh'
      ]
    };
  }
}

// Singleton instance
export const extensionDetector = new ExtensionDetector();

// React hook for extension detection
export function useExtensionDetection() {
  const [detectedExtension, setDetectedExtension] = useState<DetectedExtension | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectExtension = useCallback(async () => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    try {
      const extension = await extensionDetector.detectExtension();
      setDetectedExtension(extension);
    } catch (error) {
      console.error('[useExtensionDetection] Detection failed:', error);
      setDetectedExtension(null);
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting]);

  useEffect(() => {
    detectExtension();
  }, [detectExtension]);

  return {
    detectedExtension,
    isDetecting,
    detectExtension,
    installationInstructions: extensionDetector.getInstallationInstructions()
  };
}