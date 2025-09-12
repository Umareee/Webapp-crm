"use client";

import { useState, useEffect } from 'react';
import { useAppState } from '@/context/app-state-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Key, Copy, Trash2, Plus, Shield, Monitor, Activity, AlertTriangle } from 'lucide-react';
import { getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppLayout from '@/components/layout/app-layout';

interface JWTToken {
  id: string;
  created_at: string;
  expires_at: string;
  device_count: number;
  device_limit: number;
  is_active: boolean;
}

interface Device {
  id: string;
  device_fingerprint: string;
  device_info: {
    userAgent?: string;
    screen?: { width: number; height: number };
    timezone?: string;
    language?: string;
    platform?: string;
  };
  browser_info: string;
  os_info: string;
  last_active: string;
  created_at: string;
  is_active: boolean;
  token_expires_at: string;
}

interface DeviceStats {
  totalDevices: number;
  activeDevices: number;
  devicesActiveToday: number;
  devicesActiveThisWeek: number;
  deviceLimit: number;
  browserBreakdown: Record<string, number>;
}

const JWT_API_URL = process.env.NEXT_PUBLIC_JWT_API_URL || 'http://localhost:3001/api';

export default function AuthTokensPage() {
  const { user } = useAppState();
  const { toast } = useToast();
  
  const [tokens, setTokens] = useState<JWTToken[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const getFirebaseToken = async () => {
    if (!user) throw new Error('User not authenticated');
    return await getIdToken(user);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const firebaseToken = await getFirebaseToken();
      
      // Load tokens, devices, and stats in parallel
      const [tokensRes, devicesRes, statsRes] = await Promise.all([
        fetch(`${JWT_API_URL}/auth/tokens?firebaseToken=${encodeURIComponent(firebaseToken)}`),
        fetch(`${JWT_API_URL}/devices?firebaseToken=${encodeURIComponent(firebaseToken)}`),
        fetch(`${JWT_API_URL}/devices/stats?firebaseToken=${encodeURIComponent(firebaseToken)}`)
      ]);
      
      const [tokensData, devicesData, statsData] = await Promise.all([
        tokensRes.json(),
        devicesRes.json(),
        statsRes.json()
      ]);
      
      if (tokensData.success) setTokens(tokensData.data);
      if (devicesData.success) setDevices(devicesData.data);
      if (statsData.success) setStats(statsData.data);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load authentication data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    try {
      setGenerating(true);
      const firebaseToken = await getFirebaseToken();
      
      const response = await fetch(`${JWT_API_URL}/auth/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseToken,
          deviceInfo: {
            screen: { 
              width: window.screen.width, 
              height: window.screen.height 
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newToken = data.data.token;
        setNewToken(newToken);
        
        // Register this browser as a device by validating the new token
        try {
          const validateResponse = await fetch(`${JWT_API_URL}/auth/validate-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: newToken,
              deviceInfo: {
                screen: { 
                  width: window.screen.width, 
                  height: window.screen.height 
                },
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform
              }
            })
          });
          
          const validateData = await validateResponse.json();
          if (!validateData.success) {
            console.warn('Failed to register device:', validateData.error);
          }
        } catch (error) {
          console.warn('Failed to register device:', error);
        }
        
        toast({
          title: 'Success',
          description: 'New authentication token generated successfully'
        });
        await loadData(); // Reload data
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate token',
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Generate token error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate token',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      const firebaseToken = await getFirebaseToken();
      
      const response = await fetch(`${JWT_API_URL}/auth/tokens/${tokenId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseToken,
          reason: 'Manual revocation from dashboard'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Token revoked successfully'
        });
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to revoke token',
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Revoke token error:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke token',
        variant: 'destructive'
      });
    }
  };

  const revokeDevice = async (deviceId: string) => {
    try {
      const firebaseToken = await getFirebaseToken();
      
      const response = await fetch(`${JWT_API_URL}/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseToken,
          reason: 'Manual revocation from dashboard'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Device revoked successfully'
        });
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to revoke device',
          variant: 'destructive'
        });
      }
      
    } catch (error) {
      console.error('Revoke device error:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke device',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied',
        description: 'Token copied to clipboard'
      });
    }).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to copy token',
        variant: 'destructive'
      });
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to manage authentication tokens.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Authentication Management</h1>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeDevices}/{stats.deviceLimit}</div>
                  <div className="text-sm text-muted-foreground">Active Devices</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.devicesActiveToday}</div>
                  <div className="text-sm text-muted-foreground">Active Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{tokens.length}</div>
                  <div className="text-sm text-muted-foreground">Auth Tokens</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.devicesActiveThisWeek}</div>
                  <div className="text-sm text-muted-foreground">Active This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tokens" className="w-full">
        <TabsList>
          <TabsTrigger value="tokens">Authentication Tokens</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          {/* Generate Token Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Generate New Token</span>
              </CardTitle>
              <CardDescription>
                Create a new authentication token for your Chrome extension. Maximum 4 devices per account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={generateToken} 
                disabled={generating || (stats && stats.activeDevices >= stats.deviceLimit)}
                className="w-full"
              >
                {generating ? 'Generating...' : 'Generate New Token'}
              </Button>
              
              {stats && stats.activeDevices >= stats.deviceLimit && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">
                  Device limit reached ({stats.activeDevices}/{stats.deviceLimit}). Revoke existing devices to generate new tokens.
                </div>
              )}
            </CardContent>
          </Card>

          {/* New Token Display */}
          {newToken && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">New Token Generated</CardTitle>
                <CardDescription className="text-green-700">
                  Copy this token to your Chrome extension. It will only be shown once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication Token</Label>
                  <div className="flex space-x-2">
                    <Textarea 
                      value={newToken} 
                      readOnly 
                      className="font-mono text-sm"
                      rows={4}
                    />
                    <Button 
                      onClick={() => copyToClipboard(newToken)} 
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => setNewToken(null)} 
                  variant="secondary"
                  size="sm"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Existing Tokens */}
          <Card>
            <CardHeader>
              <CardTitle>Active Tokens</CardTitle>
              <CardDescription>Manage your existing authentication tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading tokens...</div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No authentication tokens found. Generate your first token above.
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Key className="h-4 w-4" />
                          <span className="font-mono text-sm">{token.id}</span>
                          {!token.is_active && <Badge variant="secondary">Inactive</Badge>}
                          {isExpired(token.expires_at) && <Badge variant="destructive">Expired</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Created: {formatDate(token.created_at)} | 
                          Expires: {formatDate(token.expires_at)} | 
                          Devices: {token.device_count}/{token.device_limit}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Token?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revoke the token and sign out all associated devices. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeToken(token.id)}>
                              Revoke Token
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Devices</CardTitle>
              <CardDescription>Manage devices authenticated with your tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading devices...</div>
              ) : devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active devices found.
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4" />
                          <span className="font-semibold">{device.browser_info} on {device.os_info}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {device.device_fingerprint} | 
                          Last Active: {formatDate(device.last_active)} | 
                          Created: {formatDate(device.created_at)}
                        </div>
                        {device.device_info.screen && (
                          <div className="text-xs text-muted-foreground">
                            Screen: {device.device_info.screen.width}×{device.device_info.screen.height} | 
                            {device.device_info.timezone && ` TZ: ${device.device_info.timezone} |`}
                            {device.device_info.language && ` Lang: ${device.device_info.language}`}
                          </div>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Device?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will sign out this device and prevent it from accessing your account. The device will need to re-authenticate with a valid token.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeDevice(device.id)}>
                              Revoke Device
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}