// app/bulk/page.tsx - Enhanced Campaign Management
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/app-state-context';
import { useExtension } from '@/hooks/use-extension';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExtensionInstallModal } from '@/components/extension-install-modal';
import { CampaignManager } from '@/components/campaigns/campaign-manager';
import { CampaignForm } from '@/components/campaigns/campaign-form';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle2, 
  WifiOff,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import AppLayout from '@/components/layout/app-layout';
import { Skeleton } from '@/components/ui/skeleton';
import type { Campaign } from '@/lib/types';

type View = 'list' | 'create' | 'edit';

function BulkCampaignContent() {
  const { user, isOnline } = useAppState();
  const { 
    status: extensionStatus, 
    bulkSendProgress, 
    checkExtensionStatus 
  } = useExtension();
  
  const router = useRouter();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<View>('list');
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>(undefined);

  // Handle view navigation
  const handleCreateCampaign = () => {
    setEditingCampaign(undefined);
    setCurrentView('create');
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCurrentView('edit');
  };

  const handleCampaignSaved = (campaign: Campaign) => {
    setCurrentView('list');
    setEditingCampaign(undefined);
    toast({
      title: 'Success',
      description: `Campaign "${campaign.name}" has been saved.`,
    });
  };

  const handleCancelForm = () => {
    setCurrentView('list');
    setEditingCampaign(undefined);
  };

  // Monitor extension progress
  useEffect(() => {
    if (bulkSendProgress) {
      if (bulkSendProgress.isActive) {
        toast({
          title: 'Campaign Running',
          description: `Sending messages: ${bulkSendProgress.currentIndex}/${bulkSendProgress.totalCount}`,
        });
      } else if (bulkSendProgress.successCount > 0) {
        toast({
          title: 'Campaign Complete',
          description: `${bulkSendProgress.successCount}/${bulkSendProgress.totalCount} messages sent successfully.`,
        });
      }
    }
  }, [bulkSendProgress, toast]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentView !== 'list' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelForm}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaigns
              </Button>
            )}
            <h1 className="text-3xl font-bold tracking-tight">
              {currentView === 'list' ? 'Campaign Management' : 
               currentView === 'create' ? 'Create Campaign' : 'Edit Campaign'}
            </h1>
          </div>
          
          {currentView === 'list' && (
            <Button onClick={handleCreateCampaign}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          )}
        </div>
        
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
      {currentView === 'list' && (
        <CampaignManager 
          onEditCampaign={handleEditCampaign}
          onCreateCampaign={handleCreateCampaign}
        />
      )}

      {(currentView === 'create' || currentView === 'edit') && (
        <CampaignForm
          campaign={editingCampaign}
          onSave={handleCampaignSaved}
          onCancel={handleCancelForm}
        />
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
              <div className="md:col-span-3 space-y-4">
                <Skeleton className="h-48 w-full" />
              </div>
              <div className="md:col-span-5 space-y-4">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BulkCampaignContent />
    </AppLayout>
  );
}