
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2, PlusCircle, ArrowRight } from 'lucide-react';
import UserMenu from '@/components/user-menu';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  operation: string;
  outputText: string;
  createdAt: Timestamp;
  userId: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoadingProjects(true);
      const projectsCol = collection(db, 'projects');
      const q = query(
        projectsCol,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          userProjects.push({ id: doc.id, ...doc.data() } as Project);
        });
        setProjects(userProjects);
        setLoadingProjects(false);
      }, (error) => {
        console.error("Error fetching projects: ", error);
        toast({ variant: 'destructive', title: 'Could not load projects.', description: 'Please check your connection and try again.'});
        setLoadingProjects(false);
      });

      return () => unsubscribe();
    }
  }, [user, toast]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const renderProjectCardSkeleton = () => (
      <Card className="flex flex-col">
          <CardHeader>
              <Skeleton className="h-6 w-2/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="flex-grow space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter>
              <Skeleton className="h-10 w-full" />
          </CardFooter>
      </Card>
  )

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
           <Link href="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary">Tex.io Dashboard</h1>
           </Link>
          <div className="flex items-center gap-4">
            <Link href="/editor">
                <Button>
                    Go to Editor <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold">Welcome back, {user.displayName || 'User'}!</h2>
                <p className="text-muted-foreground">Here are your recent projects.</p>
            </div>
            <Link href="/editor">
                <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Project
                </Button>
            </Link>
        </div>

        {loadingProjects ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>{renderProjectCardSkeleton()}</div>
                ))}
            </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl capitalize truncate">{project.operation || "Project"}</CardTitle>
                    {project.createdAt && (
                       <Badge variant="secondary">
                            {formatDistanceToNow(project.createdAt.toDate(), { addSuffix: true })}
                        </Badge>
                    )}
                  </div>
                  <CardDescription>Generated content</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {project.outputText}
                  </p>
                </CardContent>
                <CardFooter>
                    <Link href={`/editor?projectId=${project.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                            Open in Editor
                        </Button>
                    </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
           <div className="text-center py-20 bg-background rounded-lg border-2 border-dashed border-muted">
                <h3 className="text-2xl font-semibold">Your Workspace is Empty</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">It looks like you don't have any projects yet. Start by creating your first piece of content in the editor.</p>
                <Link href="/editor" className="mt-6 inline-block">
                    <Button size="lg">
                         <PlusCircle className="mr-2 h-4 w-4" /> Start Your First Project
                    </Button>
                </Link>
            </div>
        )}
      </main>
    </div>
  );
}
