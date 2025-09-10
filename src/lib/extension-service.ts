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
  private extensionId = 'ikadenoepdcldpfoenoibjdmdpjpkhhp'; // Your extension ID
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
    if (!window.chrome?.runtime) return false;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 2000);
      
      window.chrome.runtime.sendMessage(
        this.extensionId,
        { type: 'PING' },
        (response) => {
          clearTimeout(timeout);
          resolve(!window.chrome.runtime.lastError && response?.type === 'PONG');
        }
      );
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