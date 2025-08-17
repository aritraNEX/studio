
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Users } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Button } from '@/components/ui/button';
import { CreateWorkspace } from '@/components/workspace/create-workspace';
import { KanbanColumn } from '@/components/workspace/kanban-column';
import { MembersDialog } from '@/components/workspace/members-dialog';
import { CreateTaskDialog } from '@/components/workspace/create-task-dialog';
import { ITask, IWorkspace } from '@/lib/workspace-utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<IWorkspace | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const q = query(
      collection(db, 'workspaces'),
      where(`memberUids.${user.uid}`, '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userWorkspaces = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as IWorkspace)
        );
        setWorkspaces(userWorkspaces);
        if (userWorkspaces.length > 0 && !activeWorkspace) {
          setActiveWorkspace(userWorkspaces[0]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching workspaces:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, router, activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
        const tasksQuery = query(
            collection(db, 'workspaces', activeWorkspace.id, 'tasks')
        );
      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const workspaceTasks = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ITask)
        );
        setTasks(workspaceTasks);
      });
      return () => unsubscribeTasks();
    }
  }, [activeWorkspace]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return <CreateWorkspace />;
  }
  
  if (!activeWorkspace) {
      return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
      )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen w-full flex-col bg-muted/40">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div>
            <h1 className="text-xl font-bold">{activeWorkspace.name}</h1>
            <p className="text-sm text-muted-foreground">{activeWorkspace.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMembersDialogOpen(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>{activeWorkspace.memberUids ? Object.keys(activeWorkspace.memberUids).length : 1} Members</span>
            </Button>
            <Button onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-x-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <KanbanColumn
                    status="To-Do"
                    tasks={tasks.filter((t) => t.status === 'To-Do')}
                    workspaceId={activeWorkspace.id}
                />
                <KanbanColumn
                    status="In Progress"
                    tasks={tasks.filter((t) => t.status === 'In Progress')}
                    workspaceId={activeWorkspace.id}
                />
                <KanbanColumn
                    status="Done"
                    tasks={tasks.filter((t) => t.status === 'Done')}
                    workspaceId={activeWorkspace.id}
                />
                 <KanbanColumn
                    status="Backlog"
                    tasks={tasks.filter((t) => t.status === 'Backlog')}
                    workspaceId={activeWorkspace.id}
                />
            </div>
        </main>
      </div>
       <MembersDialog
        workspace={activeWorkspace}
        open={isMembersDialogOpen}
        onOpenChange={setIsMembersDialogOpen}
      />
      <CreateTaskDialog
        workspaceId={activeWorkspace.id}
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </DndProvider>
  );
}
