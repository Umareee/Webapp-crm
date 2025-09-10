
"use client";

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/context/app-state-context';
import { addTemplate } from '@/lib/firebase';
import type { Template } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AddTemplateDialogProps {
  template?: Template;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const variables = ['{first_name}', '{last_name}', '{full_name}'];

export function AddTemplateDialog({ template, onOpenChange, children }: AddTemplateDialogProps) {
  const { user, isOnline } = useAppState();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(template?.name || '');
  const [body, setBody] = useState(template?.body || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
    if (open) {
      setName(template?.name || '');
      setBody(template?.body || '');
    }
  };

  const handleSave = async () => {
    if (!user || !name.trim() || !body.trim()) return;

    setIsSaving(true);
    try {
      await addTemplate(user.uid, { name, body }, template?.id);
      toast({
        title: `Template ${template ? 'Updated' : 'Added'}`,
        description: `Successfully ${template ? 'updated' : 'added'} the "${name}" template.`,
      });
      setName('');
      setBody('');
      handleOpenChange(false);
    } catch (error) {
      console.error("Error saving template:", error);
       toast({
        title: 'Error',
        description: 'Could not save the template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setBody(prev => `${prev} ${variable}`.trim());
  }
  
  const trigger = children ? (
    <div onClick={() => handleOpenChange(true)} className="w-full">
      {children}
    </div>
  ) : (
    <Button disabled={!isOnline}>
      <PlusCircle />
      New Template
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Add New Template'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
            />
             <div className="flex items-center flex-wrap gap-2 mt-2">
              <span className="text-sm text-muted-foreground">Insert:</span>
              {variables.map(v => (
                <Badge 
                  key={v} 
                  variant="outline" 
                  className="cursor-pointer"
                  onClick={() => insertVariable(v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !name.trim() || !body.trim() || !isOnline}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
