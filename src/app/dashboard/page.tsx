
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Home, Trash2, Edit, Users, Share2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import TaskSummaryDashboard from '@/components/task-summary-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Project {
  id: string;
  inputText: string;
  outputText: string;
  operation: string;
  ownerId: string;
  participants?: { uid: string, displayName: string, photoURL: string }[];
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
    if (authLoading || !user) {
        if (!authLoading && !user) {
           router.push('/login');
        }
        return;
    }

    const projectsRef = collection(db, 'projects');

    // Query for projects where the user is the owner
    const ownerQuery = query(
      projectsRef,
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Query for projects where the user is a participant (but not necessarily the owner)
    const participantQuery = query(
      projectsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const ownedUnsubscribe = onSnapshot(ownerQuery, (ownerSnapshot) => {
        const ownedProjects = ownerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        
        // Now listen to shared projects
        const sharedUnsubscribe = onSnapshot(participantQuery, (participantSnapshot) => {
            const sharedProjects = participantSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            
            // Combine and deduplicate
            const allProjectsMap = new Map<string, Project>();
            [...ownedProjects, ...sharedProjects].forEach(p => allProjectsMap.set(p.id, p));
            
            const combinedProjects = Array.from(allProjectsMap.values());
            combinedProjects.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
            
            setProjects(combinedProjects);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching shared projects: ", error);
            toast({ variant: "destructive", title: "Error fetching shared projects" });
            setLoading(false);
        });

        // Return the unsubscribe function for the shared projects query
        return () => sharedUnsubscribe();
    }, (error) => {
        console.error("Error fetching owned projects: ", error);
        toast({ variant: "destructive", title: "Error fetching your projects" });
        setLoading(false);
    });

    // Return the unsubscribe function for the owned projects query
    return () => ownedUnsubscribe();

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
    if(project.operation === 'document' || project.operation === 'explainer') {
        router.push(`/workspace?projectId=${project.id}`);
    } else {
        const url = new URL(window.location.origin);
        url.pathname = `/${project.operation}`;
        url.searchParams.set('projectId', project.id);
        router.push(url.toString());
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
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
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
        <TaskSummaryDashboard />
        <div className="my-8 border-t border-border"></div>
        <h2 className="text-xl font-bold tracking-tight mb-4">My Projects</h2>
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
                <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center">
                        {(project.participants?.length ?? 1) > 1 ? (
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="flex -space-x-2">
                                        {project.participants?.slice(0, 3).map(p => (
                                             <Avatar key={p.uid} className="h-6 w-6 border-2 border-background">
                                                <AvatarImage src={p.photoURL} />
                                                <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                                             </Avatar>
                                        ))}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    {project.participants?.map(p => p.displayName).join(', ')}
                                    </TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        ) : (
                            <Badge variant="outline">Personal</Badge>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {project.ownerId === user?.uid && (
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
                        )}
                        <Button variant="outline" onClick={() => handleOpenProject(project)}>
                            <Edit className="mr-2 h-4 w-4"/>
                            Open
                        </Button>
                    </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
