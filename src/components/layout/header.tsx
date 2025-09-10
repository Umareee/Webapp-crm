
import { LogIn, LogOut, MessageSquare, Search, User, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppState } from '@/context/app-state-context';
import { Button } from '../ui/button';
import { signOutWithGoogle } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, isOnline, searchQuery, setSearchQuery } = useAppState();
  const router = useRouter();
  
  const getFallbackText = () => {
    if (!user) return '';
    if (user.isAnonymous) return 'AN';
    return (user.displayName || user.email || 'U').slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return null;
    if (user.isAnonymous) {
      return `Anonymous User`;
    }
    return user.displayName || user.email;
  }

  const handleLogout = async () => {
    await signOutWithGoogle();
    router.push('/auth');
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 font-semibold">
        <MessageSquare className="h-6 w-6 text-primary" />
        <span className="hidden md:inline-block">Messenger CRM</span>
      </div>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <Badge variant={isOnline ? 'default' : 'destructive'} className="ml-auto hidden sm:block">
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tags, templates, contacts..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{getFallbackText()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getUserDisplayName()}
                  </p>
                  {!user.isAnonymous && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => router.push('/auth')} variant="outline">
            <LogIn className="mr-2 h-4 w-4" />
            Sign in
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
