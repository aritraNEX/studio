
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
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
}

function SharedWorkspacePageContent() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();


  useEffect(() => {
    if (authLoading) return; // Wait for user auth status

    const fetchWorkspace = async () => {
      try {
        const docRef = doc(db, 'workspaces', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const workspaceData = docSnap.data() as any;
          setData({
            text: workspaceData.text,
            operation: workspaceData.operation,
          });
        } else {
          setError('Workspace not found. This link may be invalid or the workspace may have been deleted.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load the workspace. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkspace();
    }
  }, [id, authLoading, user]);

  const handleSendTo = (text: string, operation: Operation) => {
    // If a user is logged in, they can chain operations
    if (user) {
        setWorkspaceText(text);
        setWorkspaceOperation(operation);
        setData({text, operation}); // Update local state to reflect the change
    } else {
    // If not logged in, redirect to login
      router.push('/login');
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
                  <CardTitle className="text-3xl font-bold tracking-tight">Shared Workspace</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground/80">
                    You are viewing a shared workspace.
                    {user ? " You can continue to chain operations." : " Sign in to interact."}
                  </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 pt-2">
                 <OperationTab
                    key={`${data.operation}-${data.text.substring(0, 10)}`}
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

