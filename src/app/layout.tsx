
/**
 * Root Layout Component
 * 
 * This is the main layout component for the Messenger CRM application.
 * It sets up global providers and styling for the entire application.
 * 
 * Key Features:
 * - Global font configuration using Inter from Google Fonts
 * - Theme provider for dark/light mode support
 * - Toast notifications system
 * - Application state management context
 * - Global CSS styles
 */

import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google'
import { AppStateProvider } from '@/context/app-state-context';

// Configure Inter font with Latin subset and CSS variable
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// Application metadata for SEO and browser display
export const metadata: Metadata = {
  title: 'Messenger CRM Dashboard',
  description: 'Manage your messenger contacts, tags, and templates.',
};

/**
 * Root Layout Function Component
 * 
 * @param children - The page content to be wrapped by the layout
 * @returns JSX element containing the complete HTML structure
 * 
 * Layout hierarchy:
 * 1. HTML element with hydration warning suppression for SSR/client consistency
 * 2. Body with Inter font applied via CSS variables
 * 3. AppStateProvider - Global state management for user, contacts, tags, templates
 * 4. ThemeProvider - Handles dark/light mode theming with system preference detection
 * 5. Page content (children) + Toast notification system
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Global state provider for authentication, contacts, tags, templates, and campaigns */}
        <AppStateProvider>
          {/* Theme provider enabling dark/light mode with system preference detection */}
          <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
          >
            {children}
            {/* Global toast notification system */}
            <Toaster />
          </ThemeProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}
