
"use client";

import { useDrag } from 'react-dnd';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ITask } from '@/lib/workspace-utils';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

interface TaskCardProps {
  task: ITask;
}

const priorityColors = {
  Low: 'bg-green-500',
  Medium: 'bg-yellow-500',
  High: 'bg-red-500',
};

export function TaskCard({ task }: TaskCardProps) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'task',
        item: { id: task.id },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
      }));

  return (
    <Card
      ref={drag}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-base">{task.title}</CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
                <div className={cn("h-2 w-2 rounded-full", priorityColors[task.priority])} />
                {task.priority}
            </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{task.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
            {task.assignee ? (
                 <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignee.photoURL || ''} />
                    <AvatarFallback>{task.assignee.displayName?.[0]}</AvatarFallback>
                </Avatar>
            ) : (
                <div className="h-6 w-6 rounded-full bg-muted" />
            )}
            <span>{task.assignee?.displayName || 'Unassigned'}</span>
        </div>
        {task.dueDate && (
            <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(task.dueDate.seconds * 1000), { addSuffix: true })}</span>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

