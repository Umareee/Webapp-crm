
/**
 * Core Data Types for Messenger CRM Application
 * 
 * This file defines the TypeScript interfaces for all data entities
 * used throughout the application. These types ensure type safety
 * and provide clear contracts for data structures.
 */

/**
 * Tag Entity
 * 
 * Tags are used to categorize and organize contacts for better management
 * and targeted messaging campaigns.
 * 
 * @example
 * const customerTag: Tag = {
 *   id: "abc123",
 *   name: "Customers",
 *   color: "#3b82f6", // Blue hex color
 *   contactCount: 245
 * };
 */
export type Tag = {
  id: string;           // Unique identifier (Firestore document ID)
  name: string;         // Display name for the tag
  color: string;        // Hex color code for UI display
  contactCount: number; // Number of contacts with this tag (calculated)
};

/**
 * TagData Type
 * 
 * Data structure for creating new tags (excludes auto-generated fields)
 */
export type TagData = Omit<Tag, 'id' | 'contactCount'>;

/**
 * Message Template Entity
 * 
 * Templates are pre-written messages that can be used for bulk messaging
 * campaigns or quick responses to common inquiries.
 * 
 * @example
 * const welcomeTemplate: Template = {
 *   id: "template_001",
 *   name: "Welcome Message",
 *   body: "Hi {{name}}, welcome to our community! How can we help you today?"
 * };
 */
export type Template = {
  id: string;    // Unique identifier (Firestore document ID)
  name: string;  // Display name for the template
  body: string;  // Message content (may include placeholders like {{name}})
};

/**
 * TemplateData Type
 * 
 * Data structure for creating new templates (excludes auto-generated ID)
 */
export type TemplateData = Omit<Template, 'id'>;

/**
 * Contact Entity
 * 
 * Represents a person that can be messaged through Facebook Messenger.
 * Contacts are imported from the browser extension or created manually.
 * 
 * @example
 * const contact: Contact = {
 *   id: "contact_123",
 *   name: "John Doe",
 *   profilePicture: "https://scontent-lax3-1.xx.fbcdn.net/v/t1.30497-1/...",
 *   tags: ["tag_customers", "tag_vip"],
 *   userId: "1234567890",
 *   source: "messenger",
 *   groupId: undefined
 * };
 */
export type Contact = {
  id: string;              // Unique identifier (Firestore document ID)
  name: string;            // Contact's display name from Messenger
  profilePicture: string;  // URL to contact's profile picture
  tags: string[];          // Array of tag IDs assigned to this contact
  userId?: string;         // Facebook Messenger user ID for sending messages
  source?: 'messenger' | 'facebook_group' | 'manual' | 'import'; // How contact was added
  groupId?: string;        // Facebook group ID if contact is from a group
};

/**
 * Campaign Entity
 * 
 * Represents a bulk messaging campaign that sends a message to multiple
 * contacts with configurable delays and progress tracking.
 * 
 * @example
 * const campaign: Campaign = {
 *   id: "campaign_001",
 *   name: "Product Launch Announcement",
 *   recipientContactIds: ["contact_1", "contact_2", "contact_3"],
 *   selectedTagIds: ["tag_customers"],
 *   message: "Check out our new product!",
 *   delay: 30, // 30 seconds between messages
 *   status: "in-progress",
 *   createdAt: serverTimestamp(),
 *   totalRecipients: 3,
 *   successCount: 1,
 *   failureCount: 0,
 *   currentIndex: 1
 * };
 */
export type Campaign = {
    id: string;                    // Unique identifier (Firestore document ID)
    name: string;                  // Campaign display name
    recipientContactIds: string[]; // Specific contacts to message
    selectedTagIds: string[];      // Tags used to select recipients
    message: string;               // Message content to send
    delay: number;                 // Seconds between messages (rate limiting)
    status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'failed' | 'cancelled';
    createdAt: any;                // Firestore serverTimestamp
    startedAt?: any;               // When campaign execution began
    completedAt?: any;             // When campaign finished
    totalRecipients: number;       // Total number of recipients
    successCount: number;          // Messages sent successfully
    failureCount: number;          // Messages that failed to send
    currentIndex: number;          // Current position in recipient list
    errors?: Array<{               // Detailed error information
        contactId: string;
        contactName: string;
        error: string;
        timestamp: any;
    }>;
};

/**
 * CampaignData Type
 * 
 * Data structure for creating new campaigns (excludes runtime fields)
 */
export type CampaignData = Omit<Campaign, 'id' | 'status' | 'createdAt' | 'startedAt' | 'completedAt' | 'successCount' | 'failureCount' | 'currentIndex' | 'errors'>

/**
 * Campaign Progress Tracking
 * 
 * Real-time progress information for active campaigns,
 * used by the browser extension to track execution status.
 */
export type CampaignProgress = {
    campaignId: string;      // Campaign being tracked
    isActive: boolean;       // Whether campaign is currently running
    currentIndex: number;    // Current position in recipient list
    totalCount: number;      // Total number of recipients
    successCount: number;    // Messages sent successfully
    failureCount: number;    // Messages that failed
    startTime: number | null; // Unix timestamp when started
    currentContact?: {       // Contact currently being processed
        id: string;
        name: string;
    };
    recentErrors: Array<{    // Recent error messages for debugging
        contactName: string;
        error: string;
        timestamp: number;
    }>;
};

/**
 * Friend Request Entity
 * 
 * Represents a friend request sent through Facebook Groups that is being tracked.
 * These are synchronized from the Chrome extension which detects and tracks
 * friend request interactions on Facebook.
 * 
 * @example
 * const friendRequest: FriendRequest = {
 *   id: "fr_123",
 *   userId: "1234567890",
 *   name: "John Doe",
 *   profilePicture: "https://scontent-lax3-1.xx.fbcdn.net/v/t1.30497-1/...",
 *   groupId: "group_456",
 *   status: "sent",
 *   sentAt: "2024-01-15T10:30:00.000Z",
 *   respondedAt: null,
 *   lastChecked: "2024-01-15T10:30:00.000Z"
 * };
 */
export type FriendRequest = {
  id: string;              // Unique identifier for the friend request
  userId: string;          // Facebook user ID of the person
  name: string;            // Name of the person the request was sent to
  profilePicture?: string; // URL to their profile picture
  groupId?: string;        // Facebook group ID where the request was initiated
  status: 'pending' | 'accepted'; // Current status
  sentAt: string;          // ISO timestamp when request was sent
  respondedAt?: string;    // ISO timestamp when request was responded to
  lastChecked?: string;    // ISO timestamp of last status check
  verificationMethod?: string; // How the status was verified (e.g., 'friends_list_name_match')
  friendsListName?: string; // Name found in friends list for verification
};

/**
 * Friend Request Statistics
 * 
 * Aggregated statistics about friend requests for dashboard display
 */
export type FriendRequestStats = {
  total: number;      // Total number of friend requests
  pending: number;    // Number of requests still pending
  accepted: number;   // Number of requests accepted
};

/**
 * Active View Types
 * 
 * Defines the different views available in the application sidebar navigation
 */
export type ActiveView = 'dashboard' | 'tags' | 'templates' | 'bulk' | 'contacts' | 'friend-requests';

/**
 * Selection Mode Types
 * 
 * Used for bulk operations - determines what type of items can be selected
 * null means no bulk selection is active
 */
export type SelectionMode = 'tag' | 'template' | 'contact' | 'friend-request' | null;
