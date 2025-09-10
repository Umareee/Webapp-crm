
"use client";

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/context/app-state-context';
import { addTag } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const colors = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#9e9e9e', '#607d8b'
];

export function AddTagDialog() {
  const { user, isOnline } = useAppState();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(colors[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !tagName.trim()) return;

    setIsSaving(true);
    try {
      await addTag(user.uid, { name: tagName, color: tagColor });
      toast({
        title: 'Tag Added',
        description: `Successfully added the "${tagName}" tag.`,
      });
      setTagName('');
      setTagColor(colors[0]);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: 'Error',
        description: 'Could not add the tag. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={!isOnline}>
          <PlusCircle />
          Add Tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tag</DialogTitle>
          <DialogDescription>
            Use variables like {'{first_name}'}, {'{last_name}'}, and {'{full_name}'} in your templates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="col-span-3 flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 ${tagColor === color ? 'border-primary ring-2 ring-ring' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setTagColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !tagName.trim() || !isOnline}>
            {isSaving ? <Loader2 className="animate-spin" /> : 'Save Tag'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
