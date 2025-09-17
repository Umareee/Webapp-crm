
/**
 * Main Application Page Component
 * 
 * This is the primary entry point for the Messenger CRM dashboard.
 * It handles authentication, view routing, and renders the appropriate view based on user selection.
 * 
 * Key Features:
 * - Authentication guard - redirects to /auth if user not authenticated
 * - Dynamic view rendering based on activeView state
 * - Search functionality that overrides view selection
 * - Loading states with skeleton placeholders
 * - Responsive layout with sidebar and main content area
 * 
 * View Types:
 * - Dashboard: Overview with statistics and recent activity
 * - Tags: Manage contact tags and categories
 * - Templates: Create and manage message templates
 * - Contacts: View and organize contacts with tag filtering
 * - Search: Search across all contacts, tags, and templates
 */

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/app-state-context';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardView } from '@/components/views/dashboard-view';
import { TagsView } from '@/components/views/tags-view';
import { TemplatesView } from '@/components/views/templates-view';
import { ContactsView } from '@/components/views/contacts-view';
import { SearchView } from '@/components/views/search-view';
import { FriendRequestsView } from '@/components/views/friend-requests-view';

/**
 * Home Page Component
 * 
 * @returns JSX element containing the main dashboard interface
 */
export default function Home() {
  // Extract necessary state from global app context
  const { user, authLoading, activeView, tags, templates, contacts, friendRequests, selectedTagId, searchQuery, refreshFriendRequestStatuses, isRefreshingFriendRequests } = useAppState();
  const router = useRouter();

  // Authentication guard effect - redirect to auth page if user not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Show loading skeleton while authenticating or if no user
  if (authLoading || !user) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-lg p-4">
          {/* Header skeleton */}
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-4">
            {/* Sidebar skeleton (hidden on mobile) */}
            <Skeleton className="h-[calc(100vh-8rem)] w-60 hidden md:block" />
            {/* Main content skeleton */}
            <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-24 rounded-lg" />
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Renders the appropriate view component based on current application state
   * 
   * Priority order:
   * 1. Search view if there's an active search query
   * 2. View selected from sidebar navigation
   * 3. Dashboard view as fallback
   * 
   * @returns JSX element for the current view
   */
  const renderActiveView = () => {
    // Search overrides all other views when active
    if (searchQuery) {
      return <SearchView />;
    }
    
    // Route to appropriate view based on sidebar selection
    switch (activeView) {
      case 'dashboard':
        return <DashboardView tags={tags} templates={templates} contacts={contacts} />;
      case 'tags':
        return <TagsView tags={tags} />;
      case 'templates':
        return <TemplatesView templates={templates} />;
      case 'contacts':
        return <ContactsView contacts={contacts} tags={tags} selectedTagId={selectedTagId} />;
      case 'friend-requests':
        return <FriendRequestsView 
          friendRequests={friendRequests} 
          onRefreshStatus={refreshFriendRequestStatuses}
          isRefreshing={isRefreshingFriendRequests}
        />;
      default:
        // Fallback to dashboard for unknown views
        return <DashboardView tags={tags} templates={templates} contacts={contacts} />;
    }
  };

  // Render the main application layout with the selected view
  return (
    <AppLayout>
      {/* Main content area with responsive padding */}
      <div className="p-4 md:p-6 lg:p-8">
        {renderActiveView()}
      </div>
    </AppLayout>
  );
}
