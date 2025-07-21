
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ABTestProvider } from '@/contexts/ab-test-context';
import 'katex/dist/katex.min.css';
import type {ReactNode} from 'react';
import Script from 'next/script';

// Metadata is not supported in client components. 
// We can move this to a parent layout if needed, but for now, we'll keep it simple.
// export const metadata: Metadata = {
//   title: 'Tex.io',
//   description: 'Paraphrase text from any image.',
// };

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const adSensePublisherId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Tex.io</title>
        <meta name="description" content="Paraphrase text from any image." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat&family=Cormorant+Garamond&family=Dancing+Script&family=Indie+Flower&family=Josefin+Sans&family=Lobster&family=Lora&family=Merriweather&family=Montserrat&family=Nunito&family=Oswald&family=Pacifico&family=Playfair+Display&family=Poppins:wght@400;600;700;800&family=Quattrocento&family=Raleway&family=Shadows+Into+Light&family=Ubuntu&display=swap" rel="stylesheet" />
        {adSensePublisherId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSensePublisherId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <ABTestProvider>
            {children}
            </ABTestProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
