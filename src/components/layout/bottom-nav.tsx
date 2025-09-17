
import type { ActiveView } from '@/lib/types';
import { Cog, FileText, Tag, Users, Send, LayoutDashboard, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BottomNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSelectedTagId: (id: string | null) => void;
}

const navItems = [
  { view: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { view: 'tags' as const, label: 'Tags', icon: Tag, href: '/' },
  { view: 'templates' as const, label: 'Templates', icon: FileText, href: '/' },
  { view: 'contacts' as const, label: 'Contacts', icon: Users, href: '/' },
  { view: 'friend-requests' as const, label: 'Friends', icon: UserPlus, href: '/' },
];

export function BottomNav({ activeView, setActiveView, setSelectedTagId }: BottomNavProps) {
  const handleNavClick = (view: ActiveView) => {
    if (view !== 'contacts') {
      setSelectedTagId(null);
    }
    setActiveView(view);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => (
           <Link href={item.href} key={item.view} passHref>
            <Button
              variant="ghost"
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-1 rounded-none text-xs',
                activeView === item.view ? 'text-primary bg-accent/50' : 'text-muted-foreground'
              )}
              onClick={() => handleNavClick(item.view)}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
