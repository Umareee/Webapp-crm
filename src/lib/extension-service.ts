// Extension Service for bidirectional sync between web app and Chrome extension

export interface ExtensionSyncService {
  // Connection management
  isExtensionConnected(): Promise<boolean>;
  getConnectionStatus(): Promise<ExtensionStatus>;
  
  // Data sync methods
  syncContacts(contacts: any[]): Promise<void>;
  syncTags(tags: any[]): Promise<void>;
  syncTemplates(templates: any[]): Promise<void>;
  
  // Listen for extension data changes
  onExtensionDataChange(callback: (data: { type: string; payload: any }) => void): () => void;
  
  // Get data from extension
  getExtensionData(type: 'contacts' | 'tags' | 'templates'): Promise<any>;
}

export interface ExtensionStatus {
  isConnected: boolean;
  browserSupported: boolean;
  browserName: string;
  hasExtensionRuntime: boolean;
  errorMessage?: string;
  suggestedAction?: string;
}

class ChromeExtensionSyncService implements ExtensionSyncService {
  // Extension ID will be determined dynamically or from environment
  private extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID || 'ikadenoepdcldpfoenoibjdmdpjpkhhp';
  private messageListeners = new Set<(data: { type: string; payload: any }) => void>();

  constructor() {
    this.setupMessageListener();
  }

  private getBrowserInfo() {
    if (typeof window === 'undefined') return null;
    
    const userAgent = window.navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(window.navigator.vendor);
    const isEdge = /Edge/.test(userAgent) || /Edg\//.test(userAgent);
    const isBrave = (window.navigator as any).brave !== undefined;
    const isFirefox = /Firefox/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    let browserName = 'Unknown';
    if (isChrome) browserName = 'Chrome';
    else if (isEdge) browserName = 'Edge';
    else if (isBrave) browserName = 'Brave';
    else if (isFirefox) browserName = 'Firefox';
    else if (isSafari) browserName = 'Safari';
    
    return {
      isChrome,
      isEdge,
      isBrave,
      isFirefox,
      isSafari,
      browserName,
      isChromeBasedBrowser: isChrome || isEdge || isBrave,
      hasExtensionSupport: !!window.chrome?.runtime,
      userAgent
    };
  }

  private setupMessageListener() {
    if (typeof window !== 'undefined' && window.chrome?.runtime) {
      window.chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type?.startsWith('SYNC_')) {
          this.messageListeners.forEach(listener => {
            listener({
              type: message.type,
              payload: message.payload
            });
          });
        }
      });
    }
  }

  async isExtensionConnected(): Promise<boolean> {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.log('[Extension Service] Server-side environment detected');
      return false;
    }

    const browserInfo = this.getBrowserInfo();
    
    // Check browser compatibility
    if (!browserInfo?.isChromeBasedBrowser) {
      console.log('[Extension Service] Non-Chrome browser detected:', browserInfo?.userAgent);
      console.log('[Extension Service] Extensions are only supported in Chrome-based browsers (Chrome, Edge, Brave)');
      return false;
    }

    // Check if Chrome runtime is available
    if (!browserInfo.hasExtensionSupport) {
      console.log('[Extension Service] Chrome runtime not available');
      
      if (browserInfo.isChrome) {
        console.log('[Extension Service] Chrome detected but no extension runtime - extensions may be disabled');
      } else if (browserInfo.isEdge) {
        console.log('[Extension Service] Edge detected but no extension runtime - make sure Chrome extensions are enabled');
      } else if (browserInfo.isBrave) {
        console.log('[Extension Service] Brave detected but no extension runtime - make sure Chrome extensions are enabled');
      }
      
      return false;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('[Extension Service] PING timeout after 3000ms - extension may not be installed or responding');
        resolve(false);
      }, 3000);
      
      console.log('[Extension Service] Sending PING to extension:', this.extensionId);
      
      try {
        window.chrome.runtime.sendMessage(
          this.extensionId,
          { type: 'PING' },
          (response) => {
            clearTimeout(timeout);
            
            if (window.chrome.runtime.lastError) {
              const error = window.chrome.runtime.lastError.message;
              console.log('[Extension Service] PING error:', error);
              
              if (error.includes('Could not establish connection')) {
                console.log('[Extension Service] Extension not installed or not responding');
              } else if (error.includes('Invalid extension id')) {
                console.log('[Extension Service] Invalid extension ID - check NEXT_PUBLIC_EXTENSION_ID');
              }
              
              resolve(false);
              return;
            }
            
            console.log('[Extension Service] PING response:', response);
            const isConnected = response?.type === 'PONG' && response?.success === true;
            console.log('[Extension Service] Extension connected:', isConnected);
            resolve(isConnected);
          }
        );
      } catch (error) {
        clearTimeout(timeout);
        console.error('[Extension Service] Error sending message to extension:', error);
        resolve(false);
      }
    });
  }

  async getConnectionStatus(): Promise<ExtensionStatus> {
    const browserInfo = this.getBrowserInfo();
    
    // Server-side rendering
    if (!browserInfo) {
      return {
        isConnected: false,
        browserSupported: false,
        browserName: 'Server',
        hasExtensionRuntime: false,
        errorMessage: 'Running on server side',
        suggestedAction: 'This check will run when the page loads in the browser'
      };
    }

    // Non-Chrome browser
    if (!browserInfo.isChromeBasedBrowser) {
      return {
        isConnected: false,
        browserSupported: false,
        browserName: browserInfo.browserName,
        hasExtensionRuntime: false,
        errorMessage: `Extensions are not supported in ${browserInfo.browserName}`,
        suggestedAction: 'Please use Chrome, Edge, or Brave browser to use extensions'
      };
    }

    // Chrome-based browser but no extension runtime
    if (!browserInfo.hasExtensionSupport) {
      return {
        isConnected: false,
        browserSupported: true,
        browserName: browserInfo.browserName,
        hasExtensionRuntime: false,
        errorMessage: 'Extension runtime not available',
        suggestedAction: browserInfo.isChrome 
          ? 'Check if extensions are enabled in Chrome settings'
          : `Make sure Chrome extensions are enabled in ${browserInfo.browserName} settings`
      };
    }

    // Try to connect to extension
    const isConnected = await this.isExtensionConnected();
    
    if (isConnected) {
      return {
        isConnected: true,
        browserSupported: true,
        browserName: browserInfo.browserName,
        hasExtensionRuntime: true
      };
    } else {
      return {
        isConnected: false,
        browserSupported: true,
        browserName: browserInfo.browserName,
        hasExtensionRuntime: true,
        errorMessage: 'Extension not responding',
        suggestedAction: 'Make sure the CRM extension is installed and enabled'
      };
    }
  }

  async syncContacts(contacts: any[]): Promise<void> {
    if (!await this.isExtensionConnected()) return;

    return new Promise((resolve, reject) => {
      window.chrome.runtime.sendMessage(
        this.extensionId,
        {
          type: 'SYNC_CONTACTS_TO_EXTENSION',
          payload: { contacts }
        },
        (response) => {
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async syncTags(tags: any[]): Promise<void> {
    if (!await this.isExtensionConnected()) return;

    return new Promise((resolve, reject) => {
      window.chrome.runtime.sendMessage(
        this.extensionId,
        {
          type: 'SYNC_TAGS_TO_EXTENSION',
          payload: { tags }
        },
        (response) => {
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async syncTemplates(templates: any[]): Promise<void> {
    if (!await this.isExtensionConnected()) return;

    return new Promise((resolve, reject) => {
      window.chrome.runtime.sendMessage(
        this.extensionId,
        {
          type: 'SYNC_TEMPLATES_TO_EXTENSION',
          payload: { templates }
        },
        (response) => {
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve();
          }
        }
      );
    });
  }

  onExtensionDataChange(callback: (data: { type: string; payload: any }) => void): () => void {
    this.messageListeners.add(callback);
    
    // Return cleanup function
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  async getExtensionData(type: 'contacts' | 'tags' | 'templates'): Promise<any> {
    if (!await this.isExtensionConnected()) return null;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      window.chrome.runtime.sendMessage(
        this.extensionId,
        {
          type: `GET_${type.toUpperCase()}_FROM_EXTENSION`
        },
        (response) => {
          clearTimeout(timeout);
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve(response?.payload);
          }
        }
      );
    });
  }
}

// Singleton instance
export const extensionSyncService = new ChromeExtensionSyncService();