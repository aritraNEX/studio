
"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TexioApp } from '@/components/texio-app';
import Preloader from '@/components/preloader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import UserMenu from '@/components/user-menu';
import { WorkspaceProvider } from '@/contexts/workspace-context';

function EditorContent() {
  const [isAppLoading, setAppLoading] = React.useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);
  
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <Preloader onAnimationComplete={() => setAppLoading(false)} />
      <div className="absolute top-4 right-4 z-50">
        <UserMenu />
      </div>
      <main className={cn(
        "flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8 transition-opacity duration-700",
        isAppLoading ? "opacity-0" : "opacity-100"
      )}>
        <div className={cn("transition-transform duration-700", isAppLoading ? "scale-95" : "scale-100")}>
          <TexioApp key={projectId} projectId={projectId} />
        </div>
      </main>
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
