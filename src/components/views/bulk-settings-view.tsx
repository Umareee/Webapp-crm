
"use client";

import { useAppState } from '@/context/app-state-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function BulkSettingsView() {
  const { setActiveView } = useAppState();
  const router = useRouter();

  useEffect(() => {
    // This component is now effectively a redirector.
    // Set the active view for nav highlighting and redirect.
    setActiveView('bulk');
    router.replace('/bulk');
  }, [router, setActiveView]);

  return null; // Render nothing as the redirect will happen
}
