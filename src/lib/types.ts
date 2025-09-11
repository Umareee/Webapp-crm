
export type Tag = {
  id: string;
  name: string;
  color: string;
  contactCount: number;
};

export type TagData = Omit<Tag, 'id' | 'contactCount'>;

export type Template = {
  id:string;
  name: string;
  body: string;
};

export type TemplateData = Omit<Template, 'id'>;

export type Contact = {
  id: string;
  name: string;
  profilePicture: string;
  tags: string[]; // array of tag IDs
  userId?: string; // Messenger user ID for sending messages
  source?: 'messenger' | 'facebook_group' | 'manual' | 'import';
  groupId?: string; // Facebook group ID for group contacts
};

export type Campaign = {
    id: string;
    name: string;
    recipientContactIds: string[];
    selectedTagIds: string[];
    message: string;
    delay: number; // in seconds between messages
    status: 'pending' | 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'failed' | 'cancelled';
    scheduledAt?: any; // serverTimestamp for scheduled campaigns
    createdAt: any; // serverTimestamp
    startedAt?: any; // serverTimestamp
    completedAt?: any; // serverTimestamp
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    currentIndex: number;
    errors?: Array<{
        contactId: string;
        contactName: string;
        error: string;
        timestamp: any;
    }>;
};

export type CampaignData = Omit<Campaign, 'id' | 'status' | 'createdAt' | 'startedAt' | 'completedAt' | 'successCount' | 'failureCount' | 'currentIndex' | 'errors'>

export type CampaignProgress = {
    campaignId: string;
    isActive: boolean;
    currentIndex: number;
    totalCount: number;
    successCount: number;
    failureCount: number;
    startTime: number | null;
    currentContact?: {
        id: string;
        name: string;
    };
    recentErrors: Array<{
        contactName: string;
        error: string;
        timestamp: number;
    }>;
};

export type ActiveView = 'dashboard' | 'tags' | 'templates' | 'bulk' | 'contacts';

export type SelectionMode = 'tag' | 'template' | 'contact' | null;
