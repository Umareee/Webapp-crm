
import type { Tag, Template, Contact, FriendRequest } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/context/app-state-context';
import { Tag as TagIcon, FileText, Users, UserPlus } from 'lucide-react';

interface DashboardViewProps {
  tags: Tag[];
  templates: Template[];
  contacts: Contact[];
}

export function DashboardView({ tags, templates, contacts }: DashboardViewProps) {
  const { setActiveView, friendRequests } = useAppState();

  // Calculate friend request stats
  const friendRequestStats = {
    total: friendRequests.length,
    pending: friendRequests.filter(fr => fr.status === 'pending').length,
    accepted: friendRequests.filter(fr => fr.status === 'accepted').length,
  };

  const stats = [
    {
      title: 'Tags',
      count: tags.length,
      icon: TagIcon,
      view: 'tags' as const,
    },
    {
      title: 'Templates',
      count: templates.length,
      icon: FileText,
      view: 'templates' as const,
    },
    {
      title: 'Contacts',
      count: contacts.length,
      icon: Users,
      view: 'contacts' as const,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
            onClick={() => setActiveView(stat.view)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
        
        {/* Friend Requests Card */}
        <Card
          className="cursor-pointer transition-shadow duration-200 hover:shadow-md"
          onClick={() => setActiveView('friend-requests')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Friend Requests</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{friendRequestStats.total}</div>
            <div className="flex items-center gap-2 mt-2">
              {friendRequestStats.pending > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {friendRequestStats.pending} pending
                </Badge>
              )}
              {friendRequestStats.accepted > 0 && (
                <Badge variant="default" className="text-xs bg-green-500">
                  {friendRequestStats.accepted} accepted
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
