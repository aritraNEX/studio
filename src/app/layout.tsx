
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { AuthProvider } from '@/contexts/auth-context';
import { ABTestProvider } from '@/contexts/ab-test-context';
import 'katex/dist/katex.min.css';

export const metadata: Metadata = {
  title: 'Tex.io',
  description: 'Paraphrase text from any image.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Caveat&family=Cormorant+Garamond&family=Dancing+Script&family=Indie+Flower&family=Josefin+Sans&family=Lobster&family=Lora&family=Merriweather&family=Montserrat&family=Nunito&family=Oswald&family=Pacifico&family=Playfair+Display&family=Poppins:wght@400;600;700;800&family=Quattrocento&family=Raleway&family=Shadows+Into+Light&family=Ubuntu&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1743205890050653"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
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
