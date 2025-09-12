
import type { ActiveView } from '@/lib/types';
import { Cog, FileText, Tag, Users, Send, LayoutDashboard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSelectedTagId: (id: string | null) => void;
}

const navItems = [
  { view: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { view: 'tags' as const, label: 'Tags', icon: Tag, href: '/' },
  { view: 'templates' as const, label: 'Templates', icon: FileText, href: '/' },
  { view: 'contacts' as const, label: 'Contacts', icon: Users, href: '/' },
  { view: 'bulk' as const, label: 'Bulk Send', icon: Send, href: '/bulk' },
];

const separateItems = [
  { label: 'Auth Tokens', icon: Shield, href: '/auth-tokens' },
];

export function Sidebar({ activeView, setActiveView, setSelectedTagId }: SidebarProps) {
  const pathname = usePathname();

  const handleNavClick = (view: ActiveView) => {
    if (view !== 'contacts') {
      setSelectedTagId(null);
    }
    setActiveView(view);
  };

  return (
    <aside className="hidden md:flex md:flex-col w-60 border-r bg-card">
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const isActive = (pathname === '/' && item.href === '/' && activeView === item.view) || (pathname === item.href && item.href !== '/');
            return (
              <Link href={item.href} key={item.view} passHref>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="justify-start gap-2 w-full"
                  onClick={() => handleNavClick(item.view)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
          
          <div className="border-t my-2 pt-2">
            {separateItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link href={item.href} key={item.href} passHref>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="justify-start gap-2 w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
