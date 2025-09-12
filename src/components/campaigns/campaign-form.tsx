"use client";

import { useState, useRef, useMemo } from 'react';
import { useAppState } from '@/context/app-state-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addCampaign, updateCampaign } from '@/lib/firebase';
import type { Campaign, Contact, CampaignData } from '@/lib/types';
import {
  Save,
  Users,
  MessageCircle,
  Clock,
  X,
} from 'lucide-react';

interface CampaignFormProps {
  campaign?: Campaign;
  onSave?: (campaign: Campaign) => void;
  onCancel?: () => void;
}

const variables = ['{first_name}', '{last_name}', '{full_name}'];

export function CampaignForm({ campaign, onSave, onCancel }: CampaignFormProps) {
  const { user, contacts, tags, templates } = useAppState();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    selectedTagIds: campaign?.selectedTagIds || [],
    message: campaign?.message || '',
    delay: campaign?.delay || 10,
  });
  
  const [saving, setSaving] = useState(false);

  // Calculate recipient contacts
  const recipientContacts = useMemo(() => {
    if (formData.selectedTagIds.length === 0) return [];
    
    const recipientMap = new Map<string, Contact>();
    contacts.forEach(contact => {
      if (formData.selectedTagIds.some(tagId => contact.tags.includes(tagId))) {
        recipientMap.set(contact.id, contact);
      }
    });
    
    return Array.from(recipientMap.values());
  }, [formData.selectedTagIds, contacts]);

  // Get valid recipients (with messenger user IDs)
  const validRecipients = recipientContacts.filter(contact => contact.userId && contact.source !== 'facebook_group');

  // Handle form field updates
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    const newTagIds = formData.selectedTagIds.includes(tagId)
      ? formData.selectedTagIds.filter(id => id !== tagId)
      : [...formData.selectedTagIds, tagId];
    
    updateField('selectedTagIds', newTagIds);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      updateField('message', selectedTemplate.body);
    }
  };

  // Insert personalization variable
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = `${text.substring(0, start)} ${variable} ${text.substring(end)}`;
    
    updateField('message', newText);
    
    textarea.focus();
    const newCursorPos = start + variable.length + 2;
    setTimeout(() => textarea.setSelectionRange(newCursorPos, newCursorPos), 0);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Campaign name is required.',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.selectedTagIds.length === 0) {
      toast({
        title: 'Validation Error', 
        description: 'Please select at least one tag.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Message content is required.',
        variant: 'destructive',
      });
      return false;
    }

    if (validRecipients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'No valid recipients found in selected tags.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSave = async () => {
    if (!user || !validateForm()) return;

    setSaving(true);
    try {
      const campaignData: CampaignData = {
        name: formData.name.trim(),
        recipientContactIds: validRecipients.map(c => c.id),
        selectedTagIds: formData.selectedTagIds,
        message: formData.message.trim(),
        delay: formData.delay,
        totalRecipients: validRecipients.length,
      };

      let savedCampaign;
      if (campaign) {
        // Update existing campaign
        await updateCampaign(user.uid, campaign.id, campaignData);
        savedCampaign = { ...campaign, ...campaignData };
      } else {
        // Create new campaign
        const campaignId = await addCampaign(user.uid, campaignData);
        savedCampaign = { 
          id: campaignId, 
          ...campaignData, 
          status: 'pending' as Campaign['status'],
          createdAt: new Date() as any,
          startedAt: undefined,
          completedAt: undefined,
          successCount: 0,
          failureCount: 0,
          currentIndex: 0,
          errors: [],
        } as Campaign;
      }

      toast({
        title: campaign ? 'Campaign Updated' : 'Campaign Created',
        description: `Campaign "${formData.name}" has been ${campaign ? 'updated' : 'created'} successfully.`,
      });

      onSave?.(savedCampaign);
      
    } catch (error: any) {
      console.error('Error saving campaign:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save campaign.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {campaign ? 'Edit Campaign' : 'Create New Campaign'}
        </h2>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="My awesome campaign"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Tag Selection */}
            <div className="space-y-3">
              <Label>Select Tags</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={tag.id}
                      checked={formData.selectedTagIds.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                      disabled={saving}
                    />
                    <Label 
                      htmlFor={tag.id} 
                      className="flex items-center gap-2 cursor-pointer flex-grow"
                    >
                      <span 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: tag.color }} 
                      />
                      <span>{tag.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        ({tag.contactCount} contacts)
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Composition */}
            <div className="space-y-3">
              <Label>Message</Label>
              
              {/* Template Selection */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="template" className="text-sm">
                    Load from template (optional)
                  </Label>
                  <Select onValueChange={handleTemplateSelect} disabled={saving}>
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Message Textarea */}
              <Textarea
                ref={textareaRef}
                placeholder="Hi {first_name}, I hope you're doing well..."
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                rows={8}
                disabled={saving}
              />
              
              {/* Variable Insertion */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Insert:</span>
                {variables.map(variable => (
                  <Badge 
                    key={variable} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Timing Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="delay">
                  Delay between messages: {formData.delay}s
                </Label>
                <Slider
                  id="delay"
                  min={5}
                  max={60}
                  step={1}
                  value={[formData.delay]}
                  onValueChange={(value) => updateField('delay', value[0])}
                  disabled={saving}
                />
              </div>
              
            </div>
          </CardContent>
        </Card>

        {/* Campaign Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Campaign Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Contacts:</span>
                <span className="text-lg font-semibold">{recipientContacts.length}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valid Recipients:</span>
                <span className="text-lg font-semibold text-green-600">
                  {validRecipients.length}
                </span>
              </div>
              
              {recipientContacts.length > validRecipients.length && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  {recipientContacts.length - validRecipients.length} contacts don't have 
                  valid Messenger user IDs and will be skipped.
                </div>
              )}
            </div>

            {/* Selected Tags */}
            {formData.selectedTagIds.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Selected Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.selectedTagIds.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timing Info */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{formData.delay}s delay between messages</span>
              </div>
              
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>
                  Estimated duration: ~{Math.ceil((validRecipients.length * formData.delay) / 60)} minutes
                </span>
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave}
              disabled={saving || validRecipients.length === 0}
              className="w-full"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving 
                ? 'Saving...' 
                : campaign 
                  ? 'Update Campaign' 
                  : 'Create Campaign'
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}