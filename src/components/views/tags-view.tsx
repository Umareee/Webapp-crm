
import type { Tag } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppState } from '@/context/app-state-context';
import { AddTagDialog } from '../dialogs/add-tag-dialog';
import { Button } from '../ui/button';
import { Trash2, X } from 'lucide-react';
import { deleteTag, deleteTags } from '@/lib/firebase';
import { Checkbox } from '@/components/ui/checkbox';
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
} from "@/components/ui/alert-dialog"
import { useState } from 'react';

interface TagsViewProps {
  tags: Tag[];
}

export function TagsView({ tags }: TagsViewProps) {
  const { user, contacts, setActiveView, setSelectedTagId, isOnline, selectionMode, setSelectionMode, selectedTagIds, toggleTagSelection, clearTagSelection } = useAppState();

  const handleDeleteTag = async (tagId: string) => {
    if (!user) return;
    await deleteTag(user.uid, tagId, contacts);
  };
  
  const handleCardClick = (tagId: string) => {
    if (selectionMode === 'tag') {
      toggleTagSelection(tagId, 'toggle');
    } else {
      setSelectedTagId(tagId);
      setActiveView('contacts');
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedTagIds.length === 0) return;
    await deleteTags(user.uid, selectedTagIds, contacts);
    clearTagSelection();
    setSelectionMode(null);
  }
  
  const handleToggleSelectAll = () => {
    if (selectedTagIds.length === tags.length) {
      clearTagSelection();
    } else {
      tags.forEach(t => toggleTagSelection(t.id, true));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Tags</h1>
        <div className="flex items-center gap-2">
            {selectionMode !== 'tag' && (
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('tag')} disabled={!isOnline}>
                    Select
                </Button>
            )}
            <AddTagDialog />
        </div>
      </div>
      
      {selectionMode === 'tag' && (
        <Card className="mb-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleToggleSelectAll}>
              {selectedTagIds.length === tags.length ? 'Deselect All' : 'Select All'}
            </Button>
            <p className="text-sm text-muted-foreground">{selectedTagIds.length} of {tags.length} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={selectedTagIds.length === 0}>
                  <Trash2 /> Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedTagIds.length} tag(s) and remove them from all contacts. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectionMode(null); clearTagSelection(); }}><X /></Button>
          </div>
        </Card>
      )}

      {tags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <Card 
              key={tag.id} 
              className="group relative transition-shadow duration-200 hover:shadow-md"
               style={{
                borderColor: tag.color,
              }}
              onClick={() => handleCardClick(tag.id)}
            >
              <div
                className="flex-grow cursor-pointer p-6"
                role="button"
                aria-label={`View contacts with tag ${tag.name}`}
              >
                {selectionMode === 'tag' && (
                    <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                            // Stop propagation to prevent the card's onClick from firing
                            // when only the checkbox is clicked.
                            event?.stopPropagation(); 
                            toggleTagSelection(tag.id, !!checked);
                        }}
                        onClick={(e) => e.stopPropagation()} // Also stop propagation on the click event itself
                        className="absolute top-4 left-4 h-5 w-5"
                    />
                )}
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                      aria-hidden="true"
                    />
                    {tag.name}
                  </h3>
                </div>
                <div>
                  <div className="text-lg font-bold">{tag.contactCount} Contacts</div>
                </div>
              </div>
              {selectionMode !== 'tag' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Delete tag ${tag.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the tag "{tag.name}" and remove it from all associated contacts. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
           <p className="text-muted-foreground">No tags created yet.</p>
            <div className="mt-4">
              <AddTagDialog />
            </div>
        </div>
      )}
    </div>
  );
}
