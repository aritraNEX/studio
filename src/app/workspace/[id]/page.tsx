
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ServerCrash, Home } from 'lucide-react';
import { OperationTab } from '@/components/operation-tab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkspaceProvider, useWorkspace } from '@/contexts/workspace-context';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts';

interface WorkspaceData {
  text: string;
  operation: Operation;
  ownerId: string;
}

function SharedWorkspacePageContent() {
  const { id } = useParams();
  const workspaceId = id as string;
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  
  // This context is for the main app, not the shared page, so we don't use it here.
  // const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();


  useEffect(() => {
    if (!workspaceId) return;

    const docRef = doc(db, 'workspaces', workspaceId);
    
    // Set up a real-time listener
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const workspaceData = docSnap.data() as any;
        setData({
          text: workspaceData.text,
          operation: workspaceData.operation,
          ownerId: workspaceData.ownerId,
        });
        setError(null);
      } else {
        setError('Workspace not found. This link may be invalid or the workspace may have been deleted.');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load the workspace. Please try again later.');
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [workspaceId]);

  const handleSendTo = async (text: string, operation: Operation) => {
    if (!user) {
      // If not logged in, redirect to login, as they can't make changes.
      router.push('/login');
      return;
    }
    
    // Update the document in Firestore, which will trigger the onSnapshot listener for all clients.
    try {
        const docRef = doc(db, 'workspaces', workspaceId);
        await updateDoc(docRef, {
            text: text,
            operation: operation,
        });
    } catch (err) {
        console.error("Failed to update workspace:", err);
        // Optionally show a toast error here
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <Card className="max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                   <ServerCrash className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="mt-4">Loading Error</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={() => router.push('/')}>
                    <Home className="mr-2 h-4 w-4" /> Go to Homepage
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (data) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8">
          <Card className="w-full max-w-5xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
              <CardHeader className="text-center">
                  <CardTitle className="text-3xl font-bold tracking-tight">Collaborative Workspace</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground/80">
                    You are viewing a shared workspace. Changes are reflected in real-time.
                    {!user && " Sign in to collaborate."}
                  </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 pt-2">
                 <OperationTab
                    key={`${workspaceId}-${data.operation}-${data.text.substring(0, 10)}`}
                    operation={data.operation}
                    initialText={data.text}
                    onSendTo={handleSendTo}
                 />
              </CardContent>
          </Card>
      </main>
    );
  }

  return null; // Should not be reached
}

export default function SharedWorkspacePage() {
    return (
        <AuthProvider>
            <WorkspaceProvider>
                <SharedWorkspacePageContent />
            </WorkspaceProvider>
        </AuthProvider>
    )
}
