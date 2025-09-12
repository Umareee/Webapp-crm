// app/bulk/page.tsx - Simple Bulk Send
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/app-state-context';
import { useExtension } from '@/hooks/use-extension';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExtensionInstallModal } from '@/components/extension-install-modal';
import { SimpleBulkSend } from '@/components/simple-bulk-send';
import { 
  AlertTriangle, 
  CheckCircle2, 
  WifiOff,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';

function BulkSendContent() {
  const { user } = useAppState();
  const { 
    status: extensionStatus, 
    checkExtensionStatus 
  } = useExtension();
  
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Bulk Send Messages
        </h1>
        
        {/* Extension Status Alert */}
        <div className="mt-4 space-y-3">
          <Alert className={extensionStatus.isInstalled ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
            <div className="flex items-center gap-2">
              {extensionStatus.isConnected ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : extensionStatus.isInstalled ? (
                <WifiOff className="h-4 w-4 text-amber-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              <AlertDescription className="mb-0">
                {extensionStatus.isConnected
                  ? "Extension connected and ready for bulk sending"
                  : extensionStatus.isInstalled
                  ? "Extension installed but not responding. Please refresh Messenger tabs."
                  : "Extension not detected. Install it to enable automatic message sending."
                }
                {!extensionStatus.isInstalled && (
                  <Button 
                    variant="link" 
                    className="ml-2 p-0 h-auto font-medium text-amber-700"
                    onClick={() => setShowExtensionModal(true)}
                  >
                    Install Now
                  </Button>
                )}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>

      {/* Main Content */}
      <SimpleBulkSend />

      {/* Extension Install Modal */}
      <ExtensionInstallModal
        open={showExtensionModal}
        onOpenChange={setShowExtensionModal}
        onRetryConnection={checkExtensionStatus}
      />
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