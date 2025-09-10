
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInAnonymously as firebaseSignInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import { 
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  collection,
  updateDoc,
  arrayRemove,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  QuerySnapshot,
  DocumentData,
  getDoc,
} from 'firebase/firestore';
import type { Contact, TagData, TemplateData, Campaign, CampaignData } from './types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const signOutWithGoogle = () => {
  return signOut(auth);
}

export const signInAnonymously = () => {
  return firebaseSignInAnonymously(auth);
}

export const handleEmailSignIn = async (auth: Auth, email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const handleEmailSignUp = async (auth: Auth, email: string, password: string, displayName?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (userCredential.user && displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
};


// Firestore write functions
export const addTag = async (uid: string, tagData: TagData) => {
  const newTagRef = doc(collection(db, `users/${uid}/tags`));
  await setDoc(newTagRef, { ...tagData, createdAt: serverTimestamp() });
};

export const deleteTag = async (uid: string, tagId: string, contacts: Contact[]) => {
  const batch = writeBatch(db);

  // 1. Delete the tag document
  const tagRef = doc(db, `users/${uid}/tags`, tagId);
  batch.delete(tagRef);

  // 2. Remove the tagId from all contacts that have it
  contacts.forEach(contact => {
    if (contact.tags.includes(tagId)) {
      const contactRef = doc(db, `users/${uid}/contacts`, contact.id);
      batch.update(contactRef, {
        tags: arrayRemove(tagId)
      });
    }
  });

  await batch.commit();
};

export const deleteTags = async (uid: string, tagIds: string[], contacts: Contact[]) => {
  const batch = writeBatch(db);

  tagIds.forEach(tagId => {
    const tagRef = doc(db, `users/${uid}/tags`, tagId);
    batch.delete(tagRef);

    contacts.forEach(contact => {
        if (contact.tags.includes(tagId)) {
            const contactRef = doc(db, `users/${uid}/contacts`, contact.id);
            batch.update(contactRef, {
                tags: arrayRemove(tagId)
            });
        }
    });
  });

  await batch.commit();
};


export const untagContact = async (uid: string, contactId: string, tagId: string) => {
  const contactRef = doc(db, `users/${uid}/contacts`, contactId);
  await updateDoc(contactRef, {
    tags: arrayRemove(tagId)
  });
};

export const addTagToContact = async (uid: string, contactId: string, tagId: string) => {
  const contactRef = doc(db, `users/${uid}/contacts`, contactId);
  await updateDoc(contactRef, {
    tags: arrayUnion(tagId)
  });
};

export const removeTagFromContact = async (uid: string, contactId: string, tagId: string) => {
  const contactRef = doc(db, `users/${uid}/contacts`, contactId);
  await updateDoc(contactRef, {
    tags: arrayRemove(tagId)
  });
};

export const deleteContacts = async (uid: string, contactIds: string[]) => {
  const batch = writeBatch(db);
  contactIds.forEach(id => {
    const contactRef = doc(db, `users/${uid}/contacts`, id);
    batch.delete(contactRef);
  });
  await batch.commit();
};

export const changeContactTags = async (uid: string, contactIds: string[], tagId: string) => {
    const batch = writeBatch(db);
    contactIds.forEach(id => {
        const contactRef = doc(db, `users/${uid}/contacts`, id);
        batch.update(contactRef, {
            tags: arrayUnion(tagId)
        });
    });
    await batch.commit();
}


export const addTemplate = async (uid: string, templateData: TemplateData, templateId?: string) => {
  const id = templateId || doc(collection(db, `users/${uid}/templates`)).id;
  const templateRef = doc(db, `users/${uid}/templates`, id);
  await setDoc(templateRef, { ...templateData, updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteTemplate = async (uid: string, templateId: string) => {
  const templateRef = doc(db, `users/${uid}/templates`, templateId);
  await deleteDoc(templateRef);
};

export const deleteTemplates = async (uid: string, templateIds: string[]) => {
  const batch = writeBatch(db);
  templateIds.forEach(id => {
    const templateRef = doc(db, `users/${uid}/templates`, id);
    batch.delete(templateRef);
  });
  await batch.commit();
};

// Campaign CRUD Operations
export const addCampaign = async (uid: string, campaignData: CampaignData): Promise<string> => {
  const campaignCollectionRef = collection(db, `users/${uid}/campaigns`);
  const newCampaignRef = doc(campaignCollectionRef);
  await setDoc(newCampaignRef, {
    ...campaignData,
    status: campaignData.scheduledAt ? 'scheduled' : 'pending',
    createdAt: serverTimestamp(),
    successCount: 0,
    failureCount: 0,
    currentIndex: 0,
    errors: [],
  });
  return newCampaignRef.id;
};

export const updateCampaign = async (uid: string, campaignId: string, updates: Partial<Campaign>) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  await updateDoc(campaignRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCampaign = async (uid: string, campaignId: string) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  await deleteDoc(campaignRef);
};

export const deleteCampaigns = async (uid: string, campaignIds: string[]) => {
  const batch = writeBatch(db);
  campaignIds.forEach(id => {
    const campaignRef = doc(db, `users/${uid}/campaigns`, id);
    batch.delete(campaignRef);
  });
  await batch.commit();
};

// Campaign Status Updates
export const startCampaign = async (uid: string, campaignId: string) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  await updateDoc(campaignRef, {
    status: 'in-progress',
    startedAt: serverTimestamp(),
    currentIndex: 0,
  });
  
  // Also trigger the extension to start sending messages
  return triggerExtensionCampaign(uid, campaignId);
};

// Helper function to trigger extension campaign
const triggerExtensionCampaign = async (uid: string, campaignId: string) => {
  if (typeof window === 'undefined' || !(window as any).chrome?.runtime) {
    console.warn('Chrome extension not available');
    return;
  }

  try {
    // Get campaign data from Firestore first
    const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
    const campaignDoc = await getDoc(campaignRef);
    
    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }
    
    const campaignData = { id: campaignDoc.id, ...campaignDoc.data() } as Campaign;
    
    // Get contacts data from Chrome storage
    const contacts = await new Promise<any[]>((resolve) => {
      (window as any).chrome.runtime.sendMessage(
        'ikadenoepdcldpfoenoibjdmdpjpkhhp',
        { type: 'GET_CONTACTS' },
        (response: any) => {
          resolve(response?.contacts || []);
        }
      );
    });
    
    // Filter contacts for this campaign
    const campaignContacts = contacts.filter(contact => 
      campaignData.recipientContactIds.includes(contact.id) && contact.userId
    );
    
    if (campaignContacts.length === 0) {
      throw new Error('No valid contacts found for campaign');
    }

    return new Promise((resolve, reject) => {
      (window as any).chrome.runtime.sendMessage(
        'ikadenoepdcldpfoenoibjdmdpjpkhhp',
        {
          type: 'BULK_SEND',
          payload: {
            recipients: campaignContacts,
            template: campaignData.message,
            delaySec: campaignData.delay,
            campaignId: campaignId
          }
        },
        (response: any) => {
          if ((window as any).chrome.runtime.lastError) {
            console.error('Extension communication error:', (window as any).chrome.runtime.lastError);
            reject((window as any).chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error triggering extension campaign:', error);
    throw error;
  }
};

export const pauseCampaign = async (uid: string, campaignId: string) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  await updateDoc(campaignRef, {
    status: 'paused',
  });
};

export const resumeCampaign = async (uid: string, campaignId: string) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  await updateDoc(campaignRef, {
    status: 'in-progress',
  });
};

export const completeCampaign = async (uid: string, campaignId: string, finalStats: {
  successCount: number;
  failureCount: number;
  status: 'completed' | 'failed' | 'cancelled';
}) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  await updateDoc(campaignRef, {
    status: finalStats.status,
    successCount: finalStats.successCount,
    failureCount: finalStats.failureCount,
    completedAt: serverTimestamp(),
  });
};

// Campaign Progress Updates
export const updateCampaignProgress = async (
  uid: string, 
  campaignId: string, 
  progress: {
    currentIndex: number;
    successCount: number;
    failureCount: number;
    currentContact?: { id: string; name: string };
    newError?: {
      contactId: string;
      contactName: string;
      error: string;
    };
  }
) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  
  const updateData: any = {
    currentIndex: progress.currentIndex,
    successCount: progress.successCount,
    failureCount: progress.failureCount,
  };

  // Add error to the errors array if provided
  if (progress.newError) {
    updateData.errors = arrayUnion({
      ...progress.newError,
      timestamp: serverTimestamp(),
    });
  }

  await updateDoc(campaignRef, updateData);
};

// Campaign Listeners
export const listenToCampaignProgress = (
  uid: string,
  campaignId: string,
  callback: (campaign: any) => void
) => {
  const campaignRef = doc(db, `users/${uid}/campaigns`, campaignId);
  return onSnapshot(campaignRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const listenToAllCampaigns = (
  uid: string,
  callback: (campaigns: any[]) => void
) => {
  const campaignQuery = query(
    collection(db, `users/${uid}/campaigns`),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(campaignQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(campaigns);
  });
};


export { app, auth, db };
