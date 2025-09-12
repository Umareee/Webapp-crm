"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppState } from '@/context/app-state-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  listenToAllCampaigns,
  deleteCampaign,
  deleteCampaigns,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  completeCampaign,
} from '@/lib/firebase';
import type { Campaign } from '@/lib/types';
import {
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Trash2,
  Edit,
  Calendar,
  Users,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CampaignManagerProps {
  onEditCampaign?: (campaign: Campaign) => void;
  onCreateCampaign?: () => void;
}

export function CampaignManager({ onEditCampaign, onCreateCampaign }: CampaignManagerProps) {
  const { user, contacts, tags } = useAppState();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Listen to campaigns in real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToAllCampaigns(user.uid, (campaignData) => {
      setCampaigns(campaignData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Get campaign statistics
  const campaignStats = useMemo(() => {
    return campaigns.reduce(
      (stats, campaign) => {
        stats.total += 1;
        if (campaign.status === 'completed') stats.completed += 1;
        if (campaign.status === 'in-progress') stats.active += 1;
        if (campaign.status === 'failed') stats.failed += 1;
        stats.totalSent += campaign.successCount || 0;
        return stats;
      },
      { total: 0, completed: 0, active: 0, failed: 0, totalSent: 0 }
    );
  }, [campaigns]);

  // Handle campaign actions
  const handleStartCampaign = async (campaignId: string) => {
    if (!user) return;
    
    setActionLoading(campaignId);
    try {
      await startCampaign(user.uid, campaignId);
      toast({
        title: 'Campaign Started',
        description: 'The campaign has been started successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start campaign.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    if (!user) return;
    
    setActionLoading(campaignId);
    try {
      await pauseCampaign(user.uid, campaignId);
      toast({
        title: 'Campaign Paused',
        description: 'The campaign has been paused.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to pause campaign.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    if (!user) return;
    
    setActionLoading(campaignId);
    try {
      await resumeCampaign(user.uid, campaignId);
      toast({
        title: 'Campaign Resumed',
        description: 'The campaign has been resumed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume campaign.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user) return;
    
    setActionLoading(campaignId);
    try {
      await deleteCampaign(user.uid, campaignId);
      toast({
        title: 'Campaign Deleted',
        description: 'The campaign has been deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedCampaignIds.length === 0) return;
    
    setActionLoading('bulk-delete');
    try {
      await deleteCampaigns(user.uid, selectedCampaignIds);
      setSelectedCampaignIds([]);
      toast({
        title: 'Campaigns Deleted',
        description: `${selectedCampaignIds.length} campaigns have been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaigns.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Get status badge for campaign
  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], { variant: any; icon: any; color: string }> = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-gray-500' },
      scheduled: { variant: 'outline', icon: Calendar, color: 'text-blue-500' },
      'in-progress': { variant: 'default', icon: Loader2, color: 'text-blue-500' },
      paused: { variant: 'secondary', icon: Pause, color: 'text-yellow-500' },
      completed: { variant: 'success', icon: CheckCircle, color: 'text-green-500' },
      failed: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
      cancelled: { variant: 'outline', icon: AlertCircle, color: 'text-gray-500' },
    };

    const { variant, icon: Icon, color } = variants[status];
    
    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color} ${status === 'in-progress' ? 'animate-spin' : ''}`} />
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  // Get progress percentage
  const getProgressPercentage = (campaign: Campaign) => {
    if (campaign.totalRecipients === 0) return 0;
    return Math.round(((campaign.currentIndex || 0) / campaign.totalRecipients) * 100);
  };

  // Format campaign tags
  const formatCampaignTags = (tagIds: string[] | undefined) => {
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return 'No tags selected';
    }
    
    if (!tags || !Array.isArray(tags)) {
      return 'Tags not loaded';
    }
    
    return tagIds
      .map(tagId => tags.find(tag => tag.id === tagId)?.name)
      .filter(Boolean)
      .join(', ') || 'No tags found';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading campaigns...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{campaignStats.total}</div>
            <div className="text-sm text-muted-foreground">Total Campaigns</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{campaignStats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{campaignStats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{campaignStats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{campaignStats.totalSent}</div>
            <div className="text-sm text-muted-foreground">Messages Sent</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Campaigns</h3>
        <div className="flex items-center gap-2">
          {selectedCampaignIds.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={actionLoading === 'bulk-delete'}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected ({selectedCampaignIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Campaigns</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedCampaignIds.length} campaigns? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {onCreateCampaign && (
            <Button onClick={onCreateCampaign}>
              Create Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardContent className="p-0">
          {(campaigns || []).length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first campaign to start sending bulk messages.
              </p>
              {onCreateCampaign && (
                <Button onClick={onCreateCampaign}>
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-4">
                    <input
                      type="checkbox"
                      checked={selectedCampaignIds.length === (campaigns || []).length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCampaignIds((campaigns || []).map(c => c.id));
                        } else {
                          setSelectedCampaignIds([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(campaigns || []).map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCampaignIds.includes(campaign.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCampaignIds([...selectedCampaignIds, campaign.id]);
                          } else {
                            setSelectedCampaignIds(selectedCampaignIds.filter(id => id !== campaign.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Tags: {formatCampaignTags(campaign.selectedTagIds)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{campaign.currentIndex || 0} / {campaign.totalRecipients}</span>
                          <span>{getProgressPercentage(campaign)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(campaign)} className="h-2" />
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="text-green-600">✓ {campaign.successCount || 0}</span>
                          <span className="text-red-600">✗ {campaign.failureCount || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {campaign.totalRecipients}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.createdAt && formatDistanceToNow(campaign.createdAt.toDate(), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={actionLoading === campaign.id}
                          >
                            {actionLoading === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {campaign.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStartCampaign(campaign.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'in-progress' && (
                            <DropdownMenuItem onClick={() => handlePauseCampaign(campaign.id)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleResumeCampaign(campaign.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Resume
                            </DropdownMenuItem>
                          )}
                          {onEditCampaign && ['pending', 'paused'].includes(campaign.status) && (
                            <DropdownMenuItem onClick={() => onEditCampaign(campaign)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}