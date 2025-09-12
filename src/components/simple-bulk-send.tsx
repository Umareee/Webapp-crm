"use client";

import { useState, useRef, useMemo, useEffect } from 'react';
import { useAppState } from '@/context/app-state-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useExtension } from '@/hooks/use-extension';
import {
  Users,
  MessageCircle,
  Clock,
  Play,
  Square,
  X,
} from 'lucide-react';

export function SimpleBulkSend() {
  const { contacts, tags, templates } = useAppState();
  const { toast } = useToast();
  const { sendBulkCampaign, bulkSendProgress, cancelBulkSend } = useExtension();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Ensure we're in browser environment
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    selectedTagIds: [] as string[],
    message: '',
    delay: 10,
    selectedTemplateId: '',
  });

  const [sending, setSending] = useState(false);

  // Calculate recipient contacts based on selected tags
  const validRecipients = useMemo(() => {
    if (formData.selectedTagIds.length === 0) return [];
    
    return (contacts || []).filter(contact =>
      contact.tags && contact.tags.some(tagId =>
        formData.selectedTagIds.includes(tagId)
      )
    );
  }, [contacts, formData.selectedTagIds]);

  // Update field helper
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle tag selection
  const handleTagChange = (tagId: string, checked: boolean) => {
    if (checked) {
      updateField('selectedTagIds', [...formData.selectedTagIds, tagId]);
    } else {
      updateField('selectedTagIds', formData.selectedTagIds.filter(id => id !== tagId));
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      updateField('selectedTemplateId', templateId);
      updateField('message', template.body);
    }
  };

  // Insert template variable
  const insertVariable = (variable: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentMessage = formData.message;
      const newMessage = currentMessage.slice(0, start) + variable + currentMessage.slice(end);
      
      updateField('message', newMessage);
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    }
  };

  // Validate form
  const validateForm = () => {
    if (formData.selectedTagIds.length === 0) {
      toast({
        title: 'No tags selected',
        description: 'Please select at least one tag.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: 'No message',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return false;
    }

    if (validRecipients.length === 0) {
      toast({
        title: 'No recipients',
        description: 'The selected tags don\'t have any contacts.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Handle bulk send
  const handleBulkSend = async () => {
    if (!validateForm()) return;

    setSending(true);
    try {
      console.log('[Bulk Send] Starting bulk send with recipients:', validRecipients.length);
      
      const result = await sendBulkCampaign({
        recipients: validRecipients.map(contact => ({
          id: contact.id,
          name: contact.name,
          userId: contact.userId,
          source: (contact.source || 'messenger') as 'messenger' | 'facebook_group'
        })),
        message: formData.message.trim(),
        delay: formData.delay,
      });

      console.log('[Bulk Send] Result:', result);

      toast({
        title: 'Bulk Send Started',
        description: result.message || `Sending messages to ${validRecipients.length} recipients.`,
      });

      // Clear form after successful start
      setFormData(prev => ({ ...prev, message: '', selectedTemplateId: '' }));
      
    } catch (error: any) {
      console.error('[Bulk Send] Error:', error);
      
      // Provide specific error messages based on the error type
      let errorTitle = 'Error Starting Bulk Send';
      let errorDescription = error.message;
      
      if (error.message.includes('Extension not responding')) {
        errorTitle = 'Extension Connection Failed';
        errorDescription = 'The Chrome extension is not responding. Please refresh this page and make sure the extension is active.';
      } else if (error.message.includes('Chrome extension messaging')) {
        errorTitle = 'Browser Not Supported';
        errorDescription = 'Please use Chrome, Edge, or Brave browser with the extension installed.';
      } else if (error.message.includes('communication failed')) {
        errorTitle = 'Extension Communication Error';
        errorDescription = 'Failed to communicate with the extension. Please refresh the page and try again.';
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    try {
      await cancelBulkSend();
      toast({
        title: 'Bulk Send Cancelled',
        description: 'The bulk send operation has been cancelled.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to cancel bulk send.',
        variant: 'destructive',
      });
    }
  };

  // Calculate progress percentage
  const progressPercent = bulkSendProgress 
    ? Math.round((bulkSendProgress.currentIndex / bulkSendProgress.totalCount) * 100) 
    : 0;

  // Don't render extension-dependent components during SSR
  if (!isClient) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Bulk Send
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Bulk Send
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tag Selection */}
          <div className="space-y-3">
            <Label>Select Tags</Label>
            {tags && tags.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200 dark:hover:bg-blue-950/50 dark:hover:border-blue-800"
                  >
                    <Checkbox
                      checked={formData.selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tag.contactCount}
                      </Badge>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tags available. Create tags first.</p>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-3">
            <Label>Template (Optional)</Label>
            <Select value={formData.selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('{first_name}')}
                >
                  First Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('{last_name}')}
                >
                  Last Name
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable('{full_name}')}
                >
                  Full Name
                </Button>
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              id="message"
              placeholder="Hi {first_name}, I hope you're doing well..."
              value={formData.message}
              onChange={(e) => updateField('message', e.target.value)}
              disabled={sending || !!bulkSendProgress}
              className="min-h-[120px]"
            />
          </div>

          {/* Delay Settings */}
          <div className="space-y-3">
            <Label>Delay Between Messages: {formData.delay} seconds</Label>
            <Slider
              value={[formData.delay]}
              onValueChange={([value]) => updateField('delay', value)}
              min={5}
              max={30}
              step={1}
              disabled={sending || !!bulkSendProgress}
              className="w-full"
            />
          </div>

          {/* Recipients Preview */}
          {validRecipients.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/50 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                <Users className="h-4 w-4" />
                <span className="font-medium">{validRecipients.length} recipients selected</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-1">
                <Clock className="h-4 w-4" />
                <span>
                  Estimated duration: ~{Math.ceil((validRecipients.length * formData.delay) / 60)} minutes
                </span>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {bulkSendProgress && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Bulk Send in Progress</h4>
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {bulkSendProgress.currentIndex} / {bulkSendProgress.totalCount}
                    </span>
                  </div>
                  
                  <Progress 
                    value={progressPercent} 
                    className="w-full h-3 bg-blue-100 dark:bg-blue-900" 
                  />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-700 dark:text-green-400 font-medium">
                        Sent: {bulkSendProgress.successCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-red-700 dark:text-red-400 font-medium">
                        Failed: {bulkSendProgress.failureCount}
                      </span>
                    </div>
                  </div>

                  {/* Show current contact if available */}
                  {bulkSendProgress.currentContact && (
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Currently messaging: <span className="font-medium">{bulkSendProgress.currentContact.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {bulkSendProgress ? (
              <Button 
                onClick={handleCancel} 
                variant="destructive" 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                Cancel Bulk Send
              </Button>
            ) : (
              <Button 
                onClick={handleBulkSend}
                disabled={sending || validRecipients.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:text-gray-200"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {sending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Starting...
                  </>
                ) : (
                  `Send to ${validRecipients.length} Recipients`
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}