
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ListTodo, Calendar, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { TaskPlannerOutput } from '@/ai/flows/task-planner-flow';
import Link from 'next/link';
import { Button } from './ui/button';

interface TaskPlan {
    plan: TaskPlannerOutput;
    progress: Record<string, boolean>;
}

export default function TaskSummaryDashboard() {
  const { user } = useAuth();
  const [taskPlan, setTaskPlan] = useState<TaskPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    const planDocRef = doc(db, 'task_plans', user.uid);
    const unsubscribe = onSnapshot(planDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTaskPlan(docSnap.data() as TaskPlan);
      } else {
        setTaskPlan(null);
      }
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
  
  if (!taskPlan) {
    return null; // Don't show the card if there's no plan
  }

  const upcomingTasks = taskPlan.plan.subtasks
    .filter(task => !taskPlan.progress[task.title])
    .filter(task => new Date(`${task.date}T${task.time}`) >= new Date())
    .slice(0, 3);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo />
          Your Upcoming Tasks
        </CardTitle>
        <CardDescription>
            Here are the next few tasks from your plan. <Link href="/task-planner" className="text-primary hover:underline">View full plan</Link>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingTasks.length > 0 ? (
          <ul className="space-y-4">
            {upcomingTasks.map((task, index) => (
              <li key={index} className="p-3 bg-background/50 rounded-lg">
                <p className="font-semibold">{task.title}</p>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {format(new Date(task.date), 'EEE, MMM d')}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4"/> {task.time}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <p>No upcoming tasks. You're all caught up!</p>
            <Button variant="link" asChild><Link href="/task-planner">Create a new plan</Link></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
