
"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { VesperApp } from '@/components/texio-app';
import Preloader from '@/components/preloader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import UserMenu from '@/components/user-menu';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import WelcomeBanner from '@/components/welcome-banner';

function EditorContent() {
  const [isAppLoading, setAppLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const tab = searchParams.get('tab');
  const topic = searchParams.get('topic');
  const welcome = searchParams.get('welcome');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
      if (!isAppLoading) {
          window.dispatchEvent(new Event('app-ready'));
      }
  }, [isAppLoading]);

  // Immediately render the preloader, but start the app logic.
  // The preloader will be hidden by the 'app-ready' event when content is loaded.
  useEffect(() => {
    if (!authLoading) {
      setAppLoading(false);
    }
  }, [authLoading]);

  const handlePreloaderComplete = () => {
    if (welcome && user) {
        setShowWelcome(true);
    }
  }

  return (
    <WorkspaceProvider>
      <Preloader onAnimationComplete={handlePreloaderComplete} />
      <div className={cn("transition-opacity duration-700", isAppLoading ? "opacity-0" : "opacity-100")}>
        {showWelcome && <WelcomeBanner user={user} />}
        <div className="absolute top-4 right-4 z-50">
          <UserMenu />
        </div>
        <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8">
            {authLoading ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            ) : (
                <div className={cn("transition-transform duration-700", isAppLoading ? "scale-95" : "scale-100")}>
                    <VesperApp
                        key={projectId || topic || 'new'} 
                        projectId={projectId} 
                        initialTab={tab}
                        initialTopic={topic}
                    />
                </div>
            )}
        </main>
      </div>
    </WorkspaceProvider>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <EditorContent />
    </Suspense>
  )
}
