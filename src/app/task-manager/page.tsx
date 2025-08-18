
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Button } from '@/components/ui/button';
import { KanbanColumn } from '@/components/workspace/kanban-column';
import { CreateTaskDialog } from '@/components/workspace/create-task-dialog';
import { ITask } from '@/lib/workspace-utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function TaskManagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
    
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const userTasks = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as ITask)
        );
        setTasks(userTasks);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
    });

    return () => unsubscribeTasks();
  }, [user, router]);


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
  
  if (!user) {
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
            <h1 className="text-xl font-bold">My Personal Task Manager</h1>
            <p className="text-sm text-muted-foreground">Your private task board.</p>
          </div>
          <div className="flex items-center gap-2">
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
                    userId={user.uid}
                />
                <KanbanColumn
                    status="In Progress"
                    tasks={tasks.filter((t) => t.status === 'In Progress')}
                    userId={user.uid}
                />
                <KanbanColumn
                    status="Done"
                    tasks={tasks.filter((t) => t.status === 'Done')}
                    userId={user.uid}
                />
                 <KanbanColumn
                    status="Backlog"
                    tasks={tasks.filter((t) => t.status === 'Backlog')}
                    userId={user.uid}
                />
            </div>
        </main>
      </div>
      <CreateTaskDialog
        userId={user.uid}
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
      />
    </DndProvider>
  );
}
