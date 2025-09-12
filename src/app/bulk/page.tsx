// app/bulk/page.tsx - Simple Bulk Send
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/app-state-context';
import { SimpleBulkSend } from '@/components/simple-bulk-send';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

function BulkSendContent() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Bulk Send Messages
        </h1>
        
      </div>

      {/* Main Content */}
      <SimpleBulkSend />
    </div>
  );
}

export default function BulkPage() {
  const { user, authLoading, setActiveView } = useAppState();
  const router = useRouter();

  useEffect(() => {
    setActiveView('bulk');
  }, [setActiveView]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BulkSendContent />
    </AppLayout>
  );
}