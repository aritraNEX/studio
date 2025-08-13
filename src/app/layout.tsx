
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { SoundProvider } from '@/contexts/sound-context';
import 'katex/dist/katex.min.css';
import type {ReactNode} from 'react';
import Preloader from '@/components/preloader';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a simple way to ensure the preloader shows for a bit.
    // In a real app, you might listen for a custom 'app-ready' event.
    const timer = setTimeout(() => {
        // This is a simple way to signal that the main app can be shown.
        // In a real app, you might wait for data fetching, etc.
        const event = new Event('app-ready');
        window.dispatchEvent(event);
    }, 500); // Ensures loader is visible for at least a short time.

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Vesper</title>
        <meta name="description" content="Your ultimate AI-powered toolkit." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4D00B3" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat&family=Cormorant+Garamond&family=Dancing+Script&family=Indie+Flower&family=Josefin+Sans&family=Lobster&family=Lora&family=Merriweather&family=Montserrat&family=Nunito&family=Oswald&family=Pacifico&family=Playfair+Display&family=Poppins:wght@400;600;700;800&family=Quattrocento&family=Raleway&family=Shadows+Into+Light&family=Ubuntu&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {loading && <Preloader onAnimationComplete={() => setLoading(false)} />}
        <AuthProvider>
          <SoundProvider>
            <LanguageProvider>
              <WorkspaceProvider>
                {children}
              </WorkspaceProvider>
            </LanguageProvider>
          </SoundProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
