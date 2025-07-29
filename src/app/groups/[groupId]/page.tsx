"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Home, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  id: string;
  inputText: string;
  outputText: string;
  operation: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

function ProjectsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                 <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <Skeleton className="h-6 w-20" />
                           <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-4 w-full pt-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full mt-2" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        userProjects.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(userProjects);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      toast({
        variant: "destructive",
        title: "Error fetching projects",
        description: "Could not load your projects. Please try again later.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, toast]);

  const handleDeleteProject = async (projectId: string) => {
    try {
        await deleteDoc(doc(db, "projects", projectId));
        toast({
            title: "Project Deleted",
            description: "The project has been successfully deleted.",
        })
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: "Could not delete the project. Please try again.",
        })
    }
  };

  const handleOpenProject = (project: Project) => {
    // A mapping from saved operation to the tab value in the UI
    const operationToTab: { [key: string]: string } = {
        explainer: 'explainer',
        paraphrase: 'paraphrase',
        summarize: 'summarize',
        translate: 'translate',
        style: 'style',
        // Add other mappings if needed
    };
    
    const tab = operationToTab[project.operation];

    if (tab) {
        const url = new URL(window.location.origin);
        url.pathname = '/';
        url.searchParams.set('tab', tab);
        
        if (project.operation === 'explainer') {
            url.searchParams.set('topic', project.inputText);
        } else {
            url.searchParams.set('projectId', project.id);
        }
        router.push(url.toString());
    } else {
        // Fallback for older projects or unmapped operations
        router.push(`/?projectId=${project.id}`);
    }
  }

  const getOutputDescription = (project: Project) => {
      if (project.operation === 'explainer') {
          try {
              const parsedOutput = JSON.parse(project.outputText);
              return parsedOutput.introduction || 'View the full explanation.';
          } catch {
              return 'View the full explanation.';
          }
      }
      return project.outputText;
  }

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
           <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/" prefetch={false}>
                <Home className="mr-2 h-4 w-4" />
                Editor
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
            <ProjectsSkeleton />
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold">No projects yet!</h2>
            <p className="text-muted-foreground mt-2">
              Go back to the editor to start creating and saving projects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg capitalize pr-2">{project.operation}</CardTitle>
                    <Badge variant="secondary">
                        {project.createdAt?.seconds ? formatDistanceToNow(new Date(project.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                    </Badge>
                  </div>
                   <CardDescription className="line-clamp-2 pt-2">
                      Input: {project.inputText}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        Output: {getOutputDescription(project)}
                    </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your project.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" onClick={() => handleOpenProject(project)} prefetch-intent="false">
                        <Edit className="mr-2 h-4 w-4"/>
                        Open
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}