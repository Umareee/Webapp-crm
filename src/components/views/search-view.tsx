
"use client";

import { useMemo } from 'react';
import { useAppState } from '@/context/app-state-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tag, FileText, User } from 'lucide-react';

export function SearchView() {
  const { searchQuery, tags, templates, contacts, setActiveView, setSelectedTagId } = useAppState();

  const filteredTags = useMemo(() => {
    if (!searchQuery) return [];
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tags, searchQuery]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return [];
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.body.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return [];
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);
  
  const handleTagClick = (tagId: string) => {
    setSelectedTagId(tagId);
    setActiveView('contacts');
  };
  
  const handleContactClick = () => {
    setActiveView('contacts');
  };
  
  const handleTemplateClick = () => {
    setActiveView('templates');
  }

  const hasResults = filteredTags.length > 0 || filteredTemplates.length > 0 || filteredContacts.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Search Results for "{searchQuery}"</h1>

      {!hasResults ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
           <p className="text-muted-foreground">No results found.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredTags.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Tag className="w-5 h-5" /> Tags</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTags.map(tag => (
                   <Card 
                      key={tag.id} 
                      className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
                      onClick={() => handleTagClick(tag.id)}
                      style={{ borderColor: tag.color }}
                    >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                         <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{tag.contactCount} contacts</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {filteredTemplates.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="cursor-pointer transition-shadow duration-200 hover:shadow-md" onClick={handleTemplateClick}>
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {filteredContacts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Contacts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredContacts.map(contact => (
                   <Card key={contact.id} className="cursor-pointer transition-shadow duration-200 hover:shadow-md" onClick={handleContactClick}>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                       <Avatar className="h-16 w-16 mb-3">
                        <AvatarImage src={contact.profilePicture} alt={contact.name} data-ai-hint="profile picture" />
                        <AvatarFallback>{contact.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold">{contact.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
