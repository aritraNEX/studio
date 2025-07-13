"use client";

import { useState } from 'react';
import { TexioApp } from '@/components/texio-app';
import Preloader from '@/components/preloader';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <Preloader onAnimationComplete={() => setIsLoading(false)} />
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <main className={cn(
        "flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8 transition-opacity duration-700",
        isLoading ? "opacity-0" : "opacity-100"
      )}>
        <div className={cn("transition-transform duration-700", isLoading ? "scale-95" : "scale-100")}>
          <TexioApp />
        </div>
      </main>
    </>
  );
}
