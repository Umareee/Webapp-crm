"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Users, 
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';
import type { FriendRequest, FriendRequestStats } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface FriendRequestsViewProps {
  friendRequests: FriendRequest[];
  onRefreshStatus: () => void;
  isRefreshing: boolean;
}

export function FriendRequestsView({ 
  friendRequests, 
  onRefreshStatus, 
  isRefreshing 
}: FriendRequestsViewProps) {
  const [stats, setStats] = useState<FriendRequestStats>({
    total: 0,
    sent: 0,
    pending: 0,
    accepted: 0
  });

  // Calculate statistics
  useEffect(() => {
    const newStats: FriendRequestStats = {
      total: friendRequests.length,
      sent: friendRequests.filter(fr => fr.status === 'sent').length,
      pending: friendRequests.filter(fr => fr.status === 'pending').length,
      accepted: friendRequests.filter(fr => fr.status === 'accepted').length
    };
    setStats(newStats);
  }, [friendRequests]);

  const getStatusColor = (status: FriendRequest['status']) => {
    switch (status) {
      case 'sent': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: FriendRequest['status']) => {
    switch (status) {
      case 'sent': return <UserPlus className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: FriendRequest['status']) => {
    switch (status) {
      case 'sent': return 'Sent';
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      default: return 'Unknown';
    }
  };

  const acceptanceRate = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;

  const filterByStatus = (status: FriendRequest['status'] | 'all') => {
    if (status === 'all') return friendRequests;
    return friendRequests.filter(fr => fr.status === status);
  };

  const FriendRequestCard = ({ request }: { request: FriendRequest }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.profilePicture} alt={request.name} />
            <AvatarFallback>
              {request.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm truncate">{request.name}</h3>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(request.status)} text-white`}
              >
                <span className="flex items-center gap-1">
                  {getStatusIcon(request.status)}
                  {getStatusText(request.status)}
                </span>
              </Badge>
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Sent {formatDistanceToNow(new Date(request.sentAt), { addSuffix: true })}
              </div>
              
              {request.respondedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Responded {formatDistanceToNow(new Date(request.respondedAt), { addSuffix: true })}
                </div>
              )}
              
              {request.groupId && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  From Facebook Group
                </div>
              )}
              
              {request.lastChecked && (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Last checked {formatDistanceToNow(new Date(request.lastChecked), { addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Friend Requests</h1>
          <p className="text-muted-foreground">
            Track and manage Facebook friend requests sent through groups
          </p>
        </div>
        
        <Button 
          onClick={onRefreshStatus} 
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Users className="h-3 w-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              Awaiting response
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3" />
              Success rate: {acceptanceRate}%
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <Progress value={acceptanceRate} className="mt-2" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3" />
              Performance
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Friend Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
          <CardDescription>
            View and manage all friend requests tracked by the extension
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({stats.sent})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {friendRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Friend Requests Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Use the browser extension to send friend requests from Facebook Groups
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {friendRequests.map(request => (
                    <FriendRequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-4">
              <div className="space-y-4">
                {filterByStatus('pending').map(request => (
                  <FriendRequestCard key={request.id} request={request} />
                ))}
                {filterByStatus('pending').length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">
                      All friend requests have been responded to
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="accepted" className="mt-4">
              <div className="space-y-4">
                {filterByStatus('accepted').map(request => (
                  <FriendRequestCard key={request.id} request={request} />
                ))}
                {filterByStatus('accepted').length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Accepted Requests</h3>
                    <p className="text-muted-foreground">
                      No friend requests have been accepted yet
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            
            <TabsContent value="sent" className="mt-4">
              <div className="space-y-4">
                {filterByStatus('sent').map(request => (
                  <FriendRequestCard key={request.id} request={request} />
                ))}
                {filterByStatus('sent').length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Sent Requests</h3>
                    <p className="text-muted-foreground">
                      No friend requests are currently in sent status
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}