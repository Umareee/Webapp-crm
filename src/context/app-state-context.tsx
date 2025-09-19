
/**
 * Application State Context
 * 
 * This file provides centralized state management for the Messenger CRM application.
 * It manages authentication, data synchronization, and UI state across all components.
 * 
 * Key Responsibilities:
 * - Firebase authentication state management
 * - Real-time Firestore data synchronization (contacts, tags, templates, campaigns)
 * - Browser extension synchronization
 * - UI state management (active view, selections, search)
 * - Online/offline status tracking
 * 
 * Data Flow:
 * 1. User authentication via Firebase Auth
 * 2. Real-time data sync from Firestore collections
 * 3. Bidirectional sync with browser extension
 * 4. State updates propagated to all consuming components
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, collection, doc, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { ActiveView, Tag, Contact, Template, Campaign, SelectionMode, FriendRequest } from '@/lib/types';
import { useSync } from '@/hooks/use-sync';

/**
 * AppState Interface
 * 
 * Defines the complete application state structure and methods available to components
 */
interface AppState {
  // Authentication state
  user: User | null;                    // Current authenticated Firebase user
  authLoading: boolean;                 // True while Firebase auth is initializing
  
  // Data loading and connectivity state
  isLoading: boolean;                   // True while Firestore data is loading
  isOnline: boolean;                    // Browser online/offline status
  
  // UI navigation state
  activeView: ActiveView;               // Currently selected view (dashboard, tags, etc.)
  selectedTagId: string | null;         // Selected tag for filtering contacts
  searchQuery: string;                  // Current search query text
  
  // Core data collections
  tags: Tag[];                          // Contact categorization tags
  contacts: Contact[];                  // Messenger contacts from extension
  templates: Template[];                // Message templates for bulk sending
  campaigns: Campaign[];                // All campaigns (completed and active)
  activeCampaigns: Campaign[];          // Currently running campaigns only
  friendRequests: FriendRequest[];      // Friend requests tracked by extension
  
  // Navigation methods
  setActiveView: (view: ActiveView) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Selection state for bulk operations
  selectionMode: SelectionMode;         // Current selection type (tag/template/contact)
  setSelectionMode: (mode: SelectionMode) => void;
  selectedTagIds: string[];             // Selected tags for bulk operations
  selectedTemplateIds: string[];        // Selected templates for bulk operations
  selectedContactIds: string[];         // Selected contacts for bulk operations
  
  // Selection management methods
  toggleTagSelection: (id: string, force?: boolean | 'toggle') => void;
  toggleTemplateSelection: (id: string, force?: boolean | 'toggle') => void;
  toggleContactSelection: (id: string, force?: boolean | 'toggle') => void;
  clearTagSelection: () => void;
  clearTemplateSelection: () => void;
  clearContactSelection: () => void;
  
  // Friend requests management
  refreshFriendRequestStatuses: () => Promise<void>;
  isRefreshingFriendRequests: boolean;
  
  // Extension bulk send progress
  extensionBulkSendProgress: any;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [isRefreshingFriendRequests, setIsRefreshingFriendRequests] = useState(false);
  
  // Extension bulk send progress state
  const [extensionBulkSendProgress, setExtensionBulkSendProgress] = useState<any>(null);
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Initialize sync with extension
  const { initializeSync } = useSync();

  // Function to sync data with extension
  const syncWithExtension = useCallback(async (dataType: 'contacts' | 'tags' | 'templates' | 'friendRequests', data: any[]) => {
    try {
      const { extensionSyncService } = await import('@/lib/extension-service');
      const isConnected = await extensionSyncService.isExtensionConnected();
      
      if (isConnected) {
        console.log(`[AppState] Syncing ${dataType} with extension:`, data.length, 'items');
        
        switch (dataType) {
          case 'contacts':
            await extensionSyncService.syncContacts(data);
            break;
          case 'tags':
            await extensionSyncService.syncTags(data);
            break;
          case 'templates':
            await extensionSyncService.syncTemplates(data);
            break;
          case 'friendRequests':
            await extensionSyncService.syncFriendRequests(data);
            break;
        }
        
        console.log(`[AppState] Successfully synced ${dataType} with extension`);
      } else {
        console.log(`[AppState] Extension not connected, skipping ${dataType} sync`);
      }
    } catch (error) {
      console.error(`[AppState] Failed to sync ${dataType} with extension:`, error);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      const tagsQuery = query(collection(userDocRef, 'tags'), orderBy('name'));
      const unsubTags = onSnapshot(tagsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const tagsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
        setTags(tagsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching tags:", error);
        setIsLoading(false);
      });

      const contactsQuery = query(collection(userDocRef, 'contacts'), orderBy('name'));
      const unsubContacts = onSnapshot(contactsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const contactsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
        setContacts(contactsData);
      }, (error) => console.error("Error fetching contacts:", error));

      const templatesQuery = query(collection(userDocRef, 'templates'), orderBy('name'));
      const unsubTemplates = onSnapshot(templatesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
        setTemplates(templatesData);
      }, (error) => console.error("Error fetching templates:", error));

      const campaignsQuery = query(collection(userDocRef, 'campaigns'), orderBy('createdAt', 'desc'));
      const unsubCampaigns = onSnapshot(campaignsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
        const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
        setCampaigns(campaignsData);
        
        // Filter active campaigns for real-time progress tracking
        const activeCampaignsData = campaignsData.filter(c => 
          c.status === 'in-progress' || c.status === 'pending'
        );
        setActiveCampaigns(activeCampaignsData);
      }, (error) => console.error("Error fetching campaigns:", error));

      return () => {
        unsubTags();
        unsubContacts();
        unsubTemplates();
        unsubCampaigns();
      };
    } else {
      setTags([]);
      setContacts([]);
      setTemplates([]);
      setCampaigns([]);
      setActiveCampaigns([]);
      setIsLoading(false);
    }
  }, [user]);

  // Update tag contact counts whenever contacts or tags change
  useEffect(() => {
    if (contacts.length > 0 || tags.length > 0) {
      const contactCounts = new Map<string, number>();
      contacts.forEach(contact => {
        contact.tags.forEach(tagId => {
          contactCounts.set(tagId, (contactCounts.get(tagId) || 0) + 1);
        });
      });

      setTags(prevTags => 
        prevTags.map(tag => ({
          ...tag,
          contactCount: contactCounts.get(tag.id) || 0,
        }))
      );
    }
  }, [contacts, tags.length]);

  // Sync data with extension whenever it changes
  useEffect(() => {
    // Sync contacts (including empty arrays to clear extension data)
    syncWithExtension('contacts', contacts);
  }, [contacts, syncWithExtension]);

  useEffect(() => {
    // Sync tags (including empty arrays to clear extension data)
    syncWithExtension('tags', tags);
  }, [tags, syncWithExtension]);

  useEffect(() => {
    // Sync templates (including empty arrays to clear extension data)
    syncWithExtension('templates', templates);
  }, [templates, syncWithExtension]);

  useEffect(() => {
    // Sync friend requests to extension (primarily for display/analytics)
    syncWithExtension('friendRequests', friendRequests);
  }, [friendRequests, syncWithExtension]);

  // Listen for sync messages from extension
  useEffect(() => {
    const handleExtensionSync = (event: MessageEvent) => {
      if (event.source !== window || event.data?.source !== 'crm-extension-sync') {
        return;
      }
      
      console.log('[AppState] Received sync from extension:', event.data.type);
      
      // Handle different sync types from extension
      switch (event.data.type) {
        case 'SYNC_TAGS_FROM_EXTENSION':
          handleTagSyncFromExtension(event.data.payload);
          break;
        case 'SYNC_CONTACTS_FROM_EXTENSION':
          handleContactSyncFromExtension(event.data.payload);
          break;
        case 'SYNC_TEMPLATES_FROM_EXTENSION':
          handleTemplateSyncFromExtension(event.data.payload);
          break;
        case 'SYNC_FRIEND_REQUESTS_FROM_EXTENSION':
          handleFriendRequestSyncFromExtension(event.data.payload);
          break;
        case 'FRIEND_REQUEST_TRACKED':
          handleFriendRequestTracked(event.data.payload);
          break;
        case 'FRIEND_REQUEST_STATUS_UPDATED':
          handleFriendRequestStatusUpdated(event.data.payload);
          break;
        case 'FRIEND_REQUEST_STATUSES_UPDATED':
          handleFriendRequestStatusesUpdated(event.data.payload);
          break;
        case 'BULK_SEND_PROGRESS_UPDATE':
          handleBulkSendProgressUpdate(event.data.payload);
          break;
        case 'BULK_SEND_STARTED':
          handleBulkSendStarted(event.data.payload);
          break;
        case 'BULK_SEND_COMPLETE':
          handleBulkSendComplete(event.data.payload);
          break;
        case 'FRIEND_REQUEST_REFRESH_UPDATE':
          handleFriendRequestRefreshUpdate(event.data.payload);
          break;
      }
    };
    
    window.addEventListener('message', handleExtensionSync);
    return () => window.removeEventListener('message', handleExtensionSync);
  }, [user]);

  const handleTagSyncFromExtension = async (extensionTags: Tag[]) => {
    if (!user) return;
    
    try {
      console.log('[AppState] Syncing tags from extension to Firebase:', extensionTags.length);
      
      // Import Firebase sync function dynamically to avoid SSR issues
      const { syncTagsFromExtension } = await import('@/lib/firebase');
      
      // Sync all extension tags to Firebase
      await syncTagsFromExtension(user.uid, extensionTags);
      
      console.log('[AppState] ✅ Tags synced from extension to Firebase successfully');
    } catch (error) {
      console.error('[AppState] ❌ Failed to sync tags from extension:', error);
    }
  };

  const handleContactSyncFromExtension = async (extensionContacts: Contact[]) => {
    if (!user) {
      console.error('[AppState] ❌ No user for contact sync');
      return;
    }
    
    try {
      console.log('[AppState] 🔄 Starting contact sync from extension to Firebase:', {
        contactCount: extensionContacts.length,
        userId: user.uid,
        contacts: extensionContacts.map(c => ({ id: c.id, name: c.name }))
      });
      
      // Import Firebase sync function dynamically to avoid SSR issues
      const { syncContactsFromExtension } = await import('@/lib/firebase');
      
      // Sync all extension contacts to Firebase
      await syncContactsFromExtension(user.uid, extensionContacts);
      
      console.log('[AppState] ✅ Contacts synced from extension to Firebase successfully');
    } catch (error) {
      console.error('[AppState] ❌ Failed to sync contacts from extension:', error);
      console.error('[AppState] Error details:', error);
    }
  };

  const handleTemplateSyncFromExtension = async (extensionTemplates: Template[]) => {
    if (!user) return;
    
    try {
      console.log('[AppState] Syncing templates from extension to Firebase:', extensionTemplates.length);
      
      // Import Firebase sync function dynamically to avoid SSR issues
      const { syncTemplatesFromExtension } = await import('@/lib/firebase');
      
      // Sync all extension templates to Firebase
      await syncTemplatesFromExtension(user.uid, extensionTemplates);
      
      console.log('[AppState] ✅ Templates synced from extension to Firebase successfully');
    } catch (error) {
      console.error('[AppState] ❌ Failed to sync templates from extension:', error);
    }
  };

  const handleFriendRequestSyncFromExtension = async (extensionFriendRequests: FriendRequest[]) => {
    console.log('[AppState] Handling friend requests sync from extension:', extensionFriendRequests.length);
    
    // For now, just update local state - friend requests are managed by extension
    // In the future, we could also sync to Firebase if needed
    setFriendRequests(extensionFriendRequests);
  };

  const handleFriendRequestTracked = (friendRequest: FriendRequest) => {
    console.log('[AppState] Friend request tracked:', friendRequest.name);
    
    setFriendRequests(prev => {
      const existingIndex = prev.findIndex(fr => fr.userId === friendRequest.userId);
      if (existingIndex >= 0) {
        // Update existing request
        const updated = [...prev];
        updated[existingIndex] = friendRequest;
        return updated;
      } else {
        // Add new request
        return [...prev, friendRequest];
      }
    });
  };

  const handleFriendRequestStatusUpdated = (data: { userId: string; status: string; timestamp: string }) => {
    console.log('[AppState] Friend request status updated:', data);
    
    setFriendRequests(prev => prev.map(fr => 
      fr.userId === data.userId 
        ? { ...fr, status: data.status as FriendRequest['status'], lastChecked: data.timestamp }
        : fr
    ));
  };

  const handleFriendRequestStatusesUpdated = (data: { acceptedFriends: any[]; updatedCount: number }) => {
    console.log('[AppState] Friend request statuses updated:', data);
    
    if (data.acceptedFriends && data.acceptedFriends.length > 0) {
      setFriendRequests(prev => prev.map(fr => {
        const acceptedFriend = data.acceptedFriends.find(af => af.userId === fr.userId);
        if (acceptedFriend) {
          return {
            ...fr,
            status: 'accepted' as const,
            respondedAt: new Date().toISOString(),
            lastChecked: new Date().toISOString()
          };
        }
        return fr;
      }));
    }
  };

  const handleBulkSendProgressUpdate = (progress: any) => {
    console.log('[AppState] 🚨🚨🚨 WEBAPP RECEIVED PROGRESS UPDATE:', progress);
    setExtensionBulkSendProgress(progress);
  };

  const handleBulkSendStarted = (data: any) => {
    console.log('[AppState] 🚨🚨🚨 WEBAPP RECEIVED BULK SEND STARTED:', data);
    // Initialize progress state when bulk send starts from extension
    setExtensionBulkSendProgress({
      isActive: true,
      currentIndex: 0,
      totalCount: data.totalCount,
      successCount: 0,
      failureCount: 0,
      startTime: data.startTime,
      currentContact: null
    });
  };

  const handleBulkSendComplete = (stats: any) => {
    console.log('[AppState] Extension bulk send complete:', stats);
    // Clear progress after showing completion for a moment
    setTimeout(() => {
      setExtensionBulkSendProgress(null);
    }, 3000);
  };

  const handleFriendRequestRefreshUpdate = (refreshState: any) => {
    console.log('[AppState] 🚨🚨🚨 WEBAPP RECEIVED FRIEND REQUEST REFRESH UPDATE:', refreshState);
    setIsRefreshingFriendRequests(refreshState.isActive);
  };


  const toggleGenericSelection = (
    id: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    force?: boolean | 'toggle'
  ) => {
    setSelected(prev => {
        const isSelected = prev.includes(id);
        const shouldBeSelected = force === 'toggle' ? !isSelected : force;

        if (shouldBeSelected && !isSelected) {
            return [...prev, id];
        }
        if (!shouldBeSelected && isSelected) {
            return prev.filter(i => i !== id);
        }
        return prev;
    });
  };

  const toggleTagSelection = (id: string, force?: boolean | 'toggle') => toggleGenericSelection(id, setSelectedTagIds, force);
  const toggleTemplateSelection = (id: string, force?: boolean | 'toggle') => toggleGenericSelection(id, setSelectedTemplateIds, force);
  const toggleContactSelection = (id: string, force?: boolean | 'toggle') => toggleGenericSelection(id, setSelectedContactIds, force);

  const clearTagSelection = () => setSelectedTagIds([]);
  const clearTemplateSelection = () => setSelectedTemplateIds([]);
  const clearContactSelection = () => setSelectedContactIds([]);

  const refreshFriendRequestStatuses = useCallback(async () => {
    try {
      const { extensionSyncService } = await import('@/lib/extension-service');
      await extensionSyncService.refreshFriendRequestStatuses();
      console.log('[AppState] Friend request statuses refresh initiated');
    } catch (error) {
      console.error('[AppState] Failed to refresh friend request statuses:', error);
      // Only set to false on error - otherwise let extension control the state
      setIsRefreshingFriendRequests(false);
    }
  }, []);

  const handleSetSelectionMode = (mode: SelectionMode) => {
    setSelectionMode(mode);
    clearTagSelection();
    clearTemplateSelection();
    clearContactSelection();
  }

  const value = {
    user,
    authLoading,
    isLoading,
    isOnline,
    activeView,
    selectedTagId,
    searchQuery,
    tags,
    contacts,
    templates,
    campaigns,
    activeCampaigns,
    friendRequests,
    setActiveView,
    setSelectedTagId,
    setSearchQuery,
    selectionMode,
    setSelectionMode: handleSetSelectionMode,
    selectedTagIds,
    selectedTemplateIds,
    selectedContactIds,
    toggleTagSelection,
    toggleTemplateSelection,
    toggleContactSelection,
    clearTagSelection,
    clearTemplateSelection,
    clearContactSelection,
    refreshFriendRequestStatuses,
    isRefreshingFriendRequests,
    extensionBulkSendProgress,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
