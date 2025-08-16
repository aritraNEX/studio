
"use client";

import { useState } from 'react';
import { Loader2, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { IMember, createTask } from '@/lib/workspace-utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';


interface CreateTaskDialogProps {
  workspaceId: string;
  members: Record<string, IMember>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ workspaceId, members, open, onOpenChange }: CreateTaskDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'To-Do' | 'In Progress' | 'Done' | 'Backlog'>('To-Do');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState<Date>();
  const [assigneeUid, setAssigneeUid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateTask = async () => {
    if (!title) {
        toast({variant: 'destructive', title: "Title is required"});
        return;
    }
    setLoading(true);
    try {
        await createTask({
            workspaceId,
            title,
            description,
            status,
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignee: assigneeUid ? members[assigneeUid] : null,
            createdBy: user!.uid,
        });
        toast({title: "Task created!"});
        onOpenChange(false);
        // Reset form
        setTitle('');
        setDescription('');
        setStatus('To-Do');
        setPriority('Medium');
        setDueDate(undefined);
        setAssigneeUid('');
    } catch(e) {
        console.error("Failed to create task", e);
        toast({variant: 'destructive', title: 'Failed to create task'});
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your workspace plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="To-Do">To-Do</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                            <SelectItem value="Backlog">Backlog</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                     <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="assignee">Assign to</Label>
                    <Select value={assigneeUid} onValueChange={setAssigneeUid}>
                        <SelectTrigger><SelectValue placeholder="Select member"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {Object.values(members).map(member => (
                                <SelectItem key={member.uid} value={member.uid}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5"><AvatarImage src={member.photoURL || ''} /><AvatarFallback>{member.displayName?.[0]}</AvatarFallback></Avatar>
                                        {member.displayName}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="dueDate"
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                        </PopoverContent>
                    </Popover>
                 </div>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={loading}>
                 {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Task
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

