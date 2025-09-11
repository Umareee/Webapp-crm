
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, collection, doc, query, orderBy, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { ActiveView, Tag, Contact, Template, Campaign, SelectionMode } from '@/lib/types';
import { useSync } from '@/hooks/use-sync';

interface AppState {
  user: User | null;
  authLoading: boolean;
  isLoading: boolean;
  isOnline: boolean;
  activeView: ActiveView;
  selectedTagId: string | null;
  searchQuery: string;
  tags: Tag[];
  contacts: Contact[];
  templates: Template[];
  campaigns: Campaign[];
  activeCampaigns: Campaign[];
  setActiveView: (view: ActiveView) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  selectionMode: SelectionMode;
  setSelectionMode: (mode: SelectionMode) => void;
  selectedTagIds: string[];
  selectedTemplateIds: string[];
  selectedContactIds: string[];
  toggleTagSelection: (id: string, force?: boolean | 'toggle') => void;
  toggleTemplateSelection: (id: string, force?: boolean | 'toggle') => void;
  toggleContactSelection: (id: string, force?: boolean | 'toggle') => void;
  clearTagSelection: () => void;
  clearTemplateSelection: () => void;
  clearContactSelection: () => void;
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
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Initialize sync with extension
  const { initializeSync } = useSync();

  // Function to sync data with extension
  const syncWithExtension = useCallback(async (dataType: 'contacts' | 'tags' | 'templates', data: any[]) => {
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
          c.status === 'in-progress' || c.status === 'pending' || c.status === 'scheduled'
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
      }
    };
    
    window.addEventListener('message', handleExtensionSync);
    return () => window.removeEventListener('message', handleExtensionSync);
  }, [user]);

  const handleTagSyncFromExtension = async (extensionTags: Tag[]) => {
    if (!user) return;
    
    try {
      console.log('[AppState] Syncing tags from extension to Firebase:', extensionTags.length);
      // TODO: Implement Firebase sync for tags from extension
      // This would involve comparing extension tags with Firebase tags
      // and updating Firebase with any changes
      console.log('[AppState] Tag sync from extension - implementation needed');
    } catch (error) {
      console.error('[AppState] Failed to sync tags from extension:', error);
    }
  };

  const handleContactSyncFromExtension = async (extensionContacts: Contact[]) => {
    if (!user) return;
    
    try {
      console.log('[AppState] Syncing contacts from extension to Firebase:', extensionContacts.length);
      // TODO: Implement Firebase sync for contacts from extension
      // This would involve comparing extension contacts with Firebase contacts
      // and updating Firebase with any changes
      console.log('[AppState] Contact sync from extension - implementation needed');
    } catch (error) {
      console.error('[AppState] Failed to sync contacts from extension:', error);
    }
  };

  const handleTemplateSyncFromExtension = async (extensionTemplates: Template[]) => {
    if (!user) return;
    
    try {
      console.log('[AppState] Syncing templates from extension to Firebase:', extensionTemplates.length);
      // TODO: Implement Firebase sync for templates from extension
      // This would involve comparing extension templates with Firebase templates
      // and updating Firebase with any changes
      console.log('[AppState] Template sync from extension - implementation needed');
    } catch (error) {
      console.error('[AppState] Failed to sync templates from extension:', error);
    }
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
