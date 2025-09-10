
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
