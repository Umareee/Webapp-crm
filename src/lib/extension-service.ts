// Extension Service for bidirectional sync between web app and Chrome extension

export interface ExtensionSyncService {
  // Connection management
  isExtensionConnected(): Promise<boolean>;
  
  // Data sync methods
  syncContacts(contacts: any[]): Promise<void>;
  syncTags(tags: any[]): Promise<void>;
  syncTemplates(templates: any[]): Promise<void>;
  
  // Listen for extension data changes
  onExtensionDataChange(callback: (data: { type: string; payload: any }) => void): () => void;
  
  // Get data from extension
  getExtensionData(type: 'contacts' | 'tags' | 'templates'): Promise<any>;
}

class ChromeExtensionSyncService implements ExtensionSyncService {
  // Extension ID will be determined dynamically or from environment
  private extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID || 'ikadenoepdcldpfoenoibjdmdpjpkhhp';
  private messageListeners = new Set<(data: { type: string; payload: any }) => void>();

  constructor() {
    this.setupMessageListener();
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

    // Check if Chrome runtime is available
    if (!window.chrome?.runtime) {
      console.log('[Extension Service] Chrome runtime not available - extension may not be installed or this is not a Chrome-based browser');
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