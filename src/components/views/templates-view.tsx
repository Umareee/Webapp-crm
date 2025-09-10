
"use client";

import { useState } from 'react';
import type { Template } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePenLine, Trash2, MoreVertical, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { deleteTemplate, deleteTemplates } from '@/lib/firebase';
import { AddTemplateDialog } from '../dialogs/add-template-dialog';

export function TemplatesView({ templates }: { templates: Template[] }) {
  const { user, isOnline, selectionMode, setSelectionMode, selectedTemplateIds, toggleTemplateSelection, clearTemplateSelection } = useAppState();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async (templateId: string) => {
    if (!user) return;
    await deleteTemplate(user.uid, templateId);
  }

  const handleDeleteSelected = async () => {
    if (!user || selectedTemplateIds.length === 0) return;
    await deleteTemplates(user.uid, selectedTemplateIds);
    clearTemplateSelection();
    setSelectionMode(null);
  }
  
  const handleToggleSelectAll = () => {
    if (selectedTemplateIds.length === templates.length) {
      clearTemplateSelection();
    } else {
      templates.forEach(t => toggleTemplateSelection(t.id, true));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Templates</h1>
         <div className="flex items-center gap-2">
            {selectionMode !== 'template' && (
                <Button variant="outline" size="sm" onClick={() => setSelectionMode('template')} disabled={!isOnline}>
                    Select
                </Button>
            )}
            <AddTemplateDialog />
        </div>
      </div>
      
       {selectionMode === 'template' && (
        <Card className="mb-4 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleToggleSelectAll}>
              {selectedTemplateIds.length === templates.length ? 'Deselect All' : 'Select All'}
            </Button>
            <p className="text-sm text-muted-foreground">{selectedTemplateIds.length} of {templates.length} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={selectedTemplateIds.length === 0}>
                  <Trash2 /> Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedTemplateIds.length} template(s). This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setSelectionMode(null); clearTemplateSelection(); }}><X /></Button>
          </div>
        </Card>
      )}

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className="flex flex-col transition-shadow duration-200 hover:shadow-md relative"
              onClick={() => selectionMode === 'template' && toggleTemplateSelection(template.id, 'toggle')}
            >
               {selectionMode === 'template' && (
                  <Checkbox
                      checked={selectedTemplateIds.includes(template.id)}
                      onCheckedChange={(checked) => {
                        event?.stopPropagation();
                        toggleTemplateSelection(template.id, !!checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-4 left-4 h-5 w-5 z-10"
                  />
               )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{template.name}</CardTitle>
                  {selectionMode !== 'template' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AddTemplateDialog template={template} onOpenChange={setIsEditDialogOpen}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                        </AddTemplateDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the template "{template.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
           <p className="text-muted-foreground">No templates created yet.</p>
            <div className="mt-4">
             <AddTemplateDialog />
           </div>
        </div>
      )}
    </div>
  );
}
