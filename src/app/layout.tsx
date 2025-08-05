
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import 'katex/dist/katex.min.css';
import type {ReactNode} from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Vesper</title>
        <meta name="description" content="Your ultimate AI-powered toolkit." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat&family=Cormorant+Garamond&family=Dancing+Script&family=Indie+Flower&family=Josefin+Sans&family=Lobster&family=Lora&family=Merriweather&family=Montserrat&family=Nunito&family=Oswald&family=Pacifico&family=Playfair+Display&family=Poppins:wght@400;600;700;800&family=Quattrocento&family=Raleway&family=Shadows+Into+Light&family=Ubuntu&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <LanguageProvider>
              <WorkspaceProvider>
                {children}
              </WorkspaceProvider>
            </LanguageProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
