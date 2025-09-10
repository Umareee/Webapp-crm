
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

export default function Home() {
  const { user, authLoading, activeView, tags, templates, contacts, selectedTagId, searchQuery } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-lg p-4">
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-[calc(100vh-8rem)] w-60 hidden md:block" />
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

  const renderActiveView = () => {
    if (searchQuery) {
      return <SearchView />;
    }
    switch (activeView) {
      case 'dashboard':
        return <DashboardView tags={tags} templates={templates} contacts={contacts} />;
      case 'tags':
        return <TagsView tags={tags} />;
      case 'templates':
        return <TemplatesView templates={templates} />;
      case 'contacts':
        return <ContactsView contacts={contacts} tags={tags} selectedTagId={selectedTagId} />;
      default:
        return <DashboardView tags={tags} templates={templates} contacts={contacts} />;
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {renderActiveView()}
      </div>
    </AppLayout>
  );
}
