
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, CalendarIcon, Loader2, Trash2, Edit, MoreVertical } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'inprogress' | 'done';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    dueDate?: Timestamp;
    tags?: string[];
    createdAt: Timestamp;
    userId: string;
}

const statusConfig: { [key in TaskStatus]: { title: string; color: string } } = {
    todo: { title: 'To Do', color: 'bg-red-500' },
    inprogress: { title: 'In Progress', color: 'bg-yellow-500' },
    done: { title: 'Done', color: 'bg-green-500' },
};

function TaskForm({ task, onSave, onCancel }: { task?: Task | null, onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => void, onCancel: () => void }) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate?.toDate());
    const [tags, setTags] = useState(task?.tags?.join(', ') || '');
    const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({
            title,
            description,
            status,
            dueDate: dueDate ? Timestamp.fromDate(dueDate) : undefined,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                <DialogDescription>
                    Fill in the details for your task below. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Finish math homework" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details..." />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="dueDate"
                                variant={"outline"}
                                className={cn("justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
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
                <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., urgent, math, chapter-5" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Task</Button>
            </DialogFooter>
        </>
    );
}

function TaskCard({ task, onUpdateStatus, onEdit, onDelete }: { task: Task, onUpdateStatus: (id: string, status: TaskStatus) => void, onEdit: () => void, onDelete: (id: string) => void }) {
    return (
        <Card className="mb-4 bg-card/80 backdrop-blur-sm group">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-md mb-2">{task.title}</h4>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {task.dueDate && (
                        <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(task.dueDate.toDate(), "MMM d")}</span>
                        </div>
                    )}
                    <span>{formatDistanceToNow(task.createdAt.toDate(), { addSuffix: true })}</span>
                </div>
                {task.tags && task.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {task.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


export function TaskManagerTab() {
    const { user, loading: authLoading } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        if (user) {
            setLoading(true);
            const tasksCol = collection(db, 'tasks');
            const q = query(tasksCol, where('userId', '==', user.uid));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const userTasks: Task[] = [];
                querySnapshot.forEach((doc) => {
                    userTasks.push({ id: doc.id, ...doc.data() } as Task);
                });
                setTasks(userTasks.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
                setLoading(false);
            }, (error) => {
                console.error("Error fetching tasks: ", error);
                toast({ variant: 'destructive', title: 'Could not load tasks.' });
                setLoading(false);
            });

            return () => unsubscribe();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading, toast]);

    const handleSaveTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
        if (!user) return;
        try {
            if (editingTask) {
                const taskRef = doc(db, 'tasks', editingTask.id);
                await updateDoc(taskRef, { ...taskData });
                toast({ title: 'Task updated!' });
            } else {
                await addDoc(collection(db, 'tasks'), {
                    ...taskData,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Task created!' });
            }
            setFormOpen(false);
            setEditingTask(null);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to save task.' });
        }
    };
    
    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteDoc(doc(db, 'tasks', taskId));
            toast({ title: 'Task deleted.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to delete task.' });
        }
    };

    const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
        try {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, { status });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Failed to update task status.' });
        }
    };

    const columns = useMemo(() => {
        const groupedTasks = tasks.reduce((acc, task) => {
            if (!acc[task.status]) acc[task.status] = [];
            acc[task.status].push(task);
            return acc;
        }, {} as Record<TaskStatus, Task[]>);

        return (Object.keys(statusConfig) as TaskStatus[]).map(status => ({
            status,
            title: statusConfig[status].title,
            tasks: groupedTasks[status] || [],
            color: statusConfig[status].color,
        }));
    }, [tasks]);

    if (loading || authLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!user) {
        return <div className="text-center py-10">Please log in to manage your tasks.</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Task Board</h2>
                <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingTask(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <TaskForm
                            key={editingTask?.id || 'new'}
                            task={editingTask}
                            onSave={handleSaveTask}
                            onCancel={() => { setFormOpen(false); setEditingTask(null); }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {columns.map(col => (
                    <div key={col.status} className="bg-muted/50 rounded-lg p-4 h-full">
                        <div className="flex items-center gap-2 mb-4">
                             <div className={cn("w-3 h-3 rounded-full", col.color)}></div>
                             <h3 className="font-semibold text-lg">{col.title}</h3>
                             <Badge variant="secondary" className="ml-2">{col.tasks.length}</Badge>
                        </div>
                        <div className="min-h-[200px]">
                           {col.tasks.map(task => (
                                <TaskCard 
                                    key={task.id}
                                    task={task}
                                    onUpdateStatus={handleUpdateStatus}
                                    onEdit={() => { setEditingTask(task); setFormOpen(true); }}
                                    onDelete={handleDeleteTask}
                                />
                           ))}
                            {col.tasks.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground pt-10">
                                    No tasks here.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
