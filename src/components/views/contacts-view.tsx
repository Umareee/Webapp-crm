
import type { Contact, Tag } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Trash2, MoreVertical, PlusCircle, Tag as TagIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
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
import { useAppState } from '@/context/app-state-context';
import { untagContact, addTagToContact, removeTagFromContact, deleteContacts, changeContactTags } from '@/lib/firebase';
import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ContactsViewProps {
  contacts: Contact[];
  tags: Tag[];
  selectedTagId: string | null;
}

export function ContactsView({ contacts, tags, selectedTagId }: ContactsViewProps) {
  const { user, setSelectedTagId, isOnline, selectionMode, setSelectionMode, selectedContactIds, toggleContactSelection, clearContactSelection } = useAppState();
  const [isChangingTags, setIsChangingTags] = useState(false);
  const [targetTagId, setTargetTagId] = useState<string>('');
  
  const displayedContacts = useMemo(() => {
    return selectedTagId
      ? contacts.filter((contact) => contact.tags.includes(selectedTagId))
      : contacts;
  }, [contacts, selectedTagId]);

  const getTagInfo = (tagId: string) => tags.find((tag) => tag.id === tagId);
  
  const selectedTag = selectedTagId ? getTagInfo(selectedTagId) : null;

  const handleUntagContact = async (contactId: string) => {
    if (!user || !selectedTagId) return;
    await untagContact(user.uid, contactId, selectedTagId);
  };
  
  const handleAddTag = async (contactId: string, tagId: string) => {
    if (!user) return;
    await addTagToContact(user.uid, contactId, tagId);
  }
  
  const handleRemoveTag = async (contactId: string, tagId: string) => {
    if (!user) return;
    await removeTagFromContact(user.uid, contactId, tagId);
  }
  
  const handleDeleteSelected = async () => {
    if (!user || selectedContactIds.length === 0) return;
    await deleteContacts(user.uid, selectedContactIds);
    clearContactSelection();
    setSelectionMode(null);
  }

  const handleApplyTagChange = async () => {
    if (!user || selectedContactIds.length === 0 || !targetTagId) return;
    setIsChangingTags(true);
    await changeContactTags(user.uid, selectedContactIds, targetTagId);
    setIsChangingTags(false);
    clearContactSelection();
    setSelectionMode(null);
  }
  
  const handleToggleSelectAll = () => {
    if (selectedContactIds.length === displayedContacts.length) {
      clearContactSelection();
    } else {
      displayedContacts.forEach(c => toggleContactSelection(c.id, true));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">
          {selectedTag ? `Contacts: ${selectedTag.name}` : 'All Contacts'}
        </h1>
        <div className="flex items-center gap-2">
            {selectedTag && (
                <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTagId(null)}
                >
                    Clear filter
                    <X className="ml-2 h-4 w-4" />
                </Button>
            )}
            {selectionMode !== 'contact' && (
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('contact')} disabled={!isOnline}>
                    Select
                </Button>
            )}
        </div>
      </div>
      
      {selectionMode === 'contact' && (
        <Card className="mb-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={handleToggleSelectAll}>
              {selectedContactIds.length === displayedContacts.length ? 'Deselect All' : 'Select All'}
            </Button>
            <p className="text-sm text-muted-foreground">{selectedContactIds.length} of {displayedContacts.length} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={setTargetTagId} disabled={selectedContactIds.length === 0}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change tag..." />
                </SelectTrigger>
                <SelectContent>
                    {tags.map(tag => (
                        <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button size="sm" onClick={handleApplyTagChange} disabled={selectedContactIds.length === 0 || !targetTagId || isChangingTags}>
              Apply
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={selectedContactIds.length === 0}>
                  <Trash2 /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedContactIds.length} contact(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectionMode(null); clearContactSelection(); }}><X /></Button>
          </div>
        </Card>
      )}

      {displayedContacts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedContacts.map((contact) => (
            <Card 
                key={contact.id} 
                className="group relative transition-shadow duration-200 hover:shadow-md"
                onClick={() => selectionMode === 'contact' && toggleContactSelection(contact.id, 'toggle')}
            >
              <CardContent className="pt-6 flex flex-col items-center text-center">
                 {selectionMode === 'contact' && (
                    <Checkbox
                        checked={selectedContactIds.includes(contact.id)}
                        onCheckedChange={(checked) => {
                            event?.stopPropagation();
                            toggleContactSelection(contact.id, !!checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 left-4 h-5 w-5"
                    />
                 )}
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={contact.profilePicture} alt={contact.name} data-ai-hint="profile picture" />
                  <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{contact.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2 justify-center">
                  {contact.tags.map((tagId) => {
                    const tag = getTagInfo(tagId);
                    if (!tag) return null;
                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{ 
                          backgroundColor: `${tag.color}33`, // 20% opacity background
                          borderColor: tag.color,
                          color: tag.color
                         }}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
              {selectionMode !== 'contact' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Contact options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger><PlusCircle /> Add Tag</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {tags.filter(t => !contact.tags.includes(t.id)).map(tag => (
                                        <DropdownMenuItem key={tag.id} onClick={() => handleAddTag(contact.id, tag.id)}>{tag.name}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger><TagIcon /> Remove Tag</DropdownMenuSubTrigger>
                             <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {tags.filter(t => contact.tags.includes(t.id)).map(tag => (
                                        <DropdownMenuItem key={tag.id} onClick={() => handleRemoveTag(contact.id, tag.id)}>{tag.name}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
           <p className="text-muted-foreground">
             {selectedTagId ? "No contacts found for this tag." : "No contacts yet."}
           </p>
        </div>
      )}
    </div>
  );
}
