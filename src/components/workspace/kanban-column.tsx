
"use client";

import { useDrop } from 'react-dnd';
import { ITask, updateTaskStatus } from '@/lib/workspace-utils';
import { TaskCard } from './task-card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface KanbanColumnProps {
  status: ITask['status'];
  tasks: ITask[];
  workspaceId: string;
}

const statusConfig = {
    "To-Do": {
        color: "border-blue-500",
        title: "To-Do"
    },
    "In Progress": {
        color: "border-yellow-500",
        title: "In Progress"
    },
    "Done": {
        color: "border-green-500",
        title: "Done"
    },
    "Backlog": {
        color: "border-gray-500",
        title: "Backlog"
    }
}


export function KanbanColumn({ status, tasks }: KanbanColumnProps) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'task',
        drop: (item: { id: string }) => updateTaskStatus(item.id, status),
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
        }),
      }));

  return (
    <div
      ref={drop}
      className={cn(
        'flex h-[calc(100vh-12rem)] w-full flex-col rounded-lg bg-background shadow-sm',
        isOver && 'bg-primary/10'
      )}
    >
      <div className={cn("flex items-center justify-between p-4 border-b-4", statusConfig[status].color)}>
        <h2 className="font-semibold">{statusConfig[status].title}</h2>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {tasks.length}
        </span>
      </div>
       <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
            {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

