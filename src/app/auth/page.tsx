
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/app-state-context';
import { signInWithGoogle, signInAnonymously, auth, handleEmailSignUp, handleEmailSignIn } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, LogIn, KeyRound, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { MessageSquare } from 'lucide-react';

export default function AuthPage() {
  const { user, authLoading } = useAppState();
  const router = useRouter();
  const { toast } = useToast();
  
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAnonLoading, setIsAnonLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleAuth = async (authFn: () => Promise<any>, setLoading: (loading: boolean) => void) => {
    setLoading(true);
    try {
      await authFn();
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message.replace('Firebase: ', '').replace(`(${error.code})`, ''),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuth(() => handleEmailSignIn(auth, signInEmail, signInPassword), setIsEmailLoading);
  };

  const onSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpPassword !== confirmPassword) {
      toast({ title: 'Sign Up Failed', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!displayName.trim()) {
      toast({ title: 'Sign Up Failed', description: 'Username is required.', variant: 'destructive' });
      return;
    }

    setIsEmailLoading(true);
    try {
      await handleEmailSignUp(auth, signUpEmail, signUpPassword, displayName);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: 'Sign Up Failed',
          description: 'An account with this email already exists.',
          variant: 'destructive',
        });
      } else {
         toast({
          title: 'Sign Up Failed',
          description: error.message.replace('Firebase: ', '').replace(`(${error.code})`, ''),
          variant: 'destructive',
        });
      }
    } finally {
        setIsEmailLoading(false);
    }
  };
  
  const onGoogleSignIn = () => {
    handleAuth(signInWithGoogle, setIsGoogleLoading);
  };

  const onAnonSignIn = () => {
    handleAuth(signInAnonymously, setIsAnonLoading);
  };

  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center mb-8">
        <MessageSquare className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-3xl font-bold">Welcome to Messenger CRM</h1>
        <p className="text-muted-foreground">Manage your contacts with ease.</p>
      </div>
      <div className="w-full max-w-md">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSignInSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" placeholder="name@example.com" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" placeholder="••••••••" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isEmailLoading}>
                    {isEmailLoading ? <Loader2 className="animate-spin" /> : <><LogIn /> Sign In</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Fill out the form to create a new account.</CardDescription>
              </CardHeader>
              <CardContent>
                 <form onSubmit={onSignUpSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-displayname">Username</Label>
                    <Input id="signup-displayname" type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="name@example.com" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required minLength={6}/>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input id="signup-confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}/>
                  </div>
                  <Button type="submit" className="w-full" disabled={isEmailLoading}>
                    {isEmailLoading ? <Loader2 className="animate-spin" /> : <><UserPlus /> Create Account</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><svg className="size-5 mr-2" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.85 1.62-4.64 0-8.59-3.82-8.59-8.59s3.95-8.59 8.59-8.59c2.52 0 4.22.98 5.17 1.89l2.76-2.76C18.99 1.21 16.03 0 12.48 0 5.88 0 .04 5.88.04 12.48s5.84 12.48 12.44 12.48c3.54 0 6.33-1.22 8.41-3.35 2.17-2.17 2.8-5.42 2.8-8.32 0-.66-.07-1.32-.19-1.98z"/></svg> Google</>}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onAnonSignIn} disabled={isAnonLoading}>
            {isAnonLoading ? <Loader2 className="animate-spin" /> : <><User /> Anonymous</> }
          </Button>
        </div>
      </div>
    </div>
  );
}
