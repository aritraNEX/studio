
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ListTodo, Calendar, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ITask } from '@/lib/workspace-utils';
import Link from 'next/link';
import { Button } from './ui/button';

interface TaskWithProgress extends ITask {
    isCompleted: boolean;
}

export default function TaskSummaryDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const userTasks = snapshot.docs.map(doc => {
            const data = doc.data() as ITask;
            return {
                ...data,
                id: doc.id,
                isCompleted: data.status === 'Done'
            };
        });
        setTasks(userTasks);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListTodo/> Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }
  
  const upcomingTasks = tasks
    .filter(task => !task.isCompleted)
    .filter(task => task.dueDate && new Date(task.dueDate.seconds * 1000) >= new Date())
    .sort((a,b) => a.dueDate.seconds - b.dueDate.seconds)
    .slice(0, 3);
    
  if (tasks.length === 0) {
    return null; // Don't show the card if there's no plan
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo />
          Your Upcoming Tasks
        </CardTitle>
        <CardDescription>
            Here are the next few tasks from your plan. <Link href="/workspace" className="text-primary hover:underline">View full plan</Link>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingTasks.length > 0 ? (
          <ul className="space-y-4">
            {upcomingTasks.map((task, index) => (
              <li key={index} className="p-3 bg-background/50 rounded-lg">
                <p className="font-semibold">{task.title}</p>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                    {task.dueDate && (
                         <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {format(new Date(task.dueDate.seconds * 1000), 'EEE, MMM d')}</span>
                    )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <p>No upcoming tasks. You're all caught up!</p>
            <Button variant="link" asChild><Link href="/workspace">Go to your workspace</Link></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
