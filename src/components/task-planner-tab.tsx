
"use client";

import { useState, useTransition } from "react";
import { ListTodo, Loader2, Sparkles, Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { taskPlanner, TaskPlannerOutput } from "@/ai/flows/task-planner-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";

export function TaskPlannerTab() {
  const [task, setTask] = useState<string>("");
  const [deadline, setDeadline] = useState<Date>();
  const [priority, setPriority] = useState<"Medium" | "Low" | "High">("Medium");
  
  const [result, setResult] = useState<TaskPlannerOutput | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGeneratePlan = () => {
    if (!task.trim()) {
      toast({ title: "Task is empty", description: "Please describe the task or project.", variant: "destructive" });
      return;
    }
    if (!deadline) {
      toast({ title: "Deadline is not set", description: "Please select a deadline for your task.", variant: "destructive" });
      return;
    }

    setError(null);
    setResult(null);
    setCheckedTasks({});

    startTransition(async () => {
      try {
        const planResult = await taskPlanner({
          task,
          deadline: deadline.toISOString(),
          priority,
        });
        if (planResult && planResult.subtasks.length > 0) {
          setResult(planResult);
        } else {
          throw new Error("The AI did not generate a plan.");
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate plan. ${errorMessage}`);
        toast({ title: "Plan Generation Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  const handleTaskCheck = (taskTitle: string) => {
    setCheckedTasks(prev => ({
        ...prev,
        [taskTitle]: !prev[taskTitle]
    }));
  };

  const completedCount = Object.values(checkedTasks).filter(Boolean).length;
  const totalCount = result?.subtasks.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="flex flex-col gap-6 p-6 border rounded-lg bg-card shadow-sm">
           <div className="space-y-2">
            <Label htmlFor="task-input" className="font-semibold text-md">Main Task or Goal</Label>
            <Input
              id="task-input"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Launch a new marketing campaign"
              className="bg-background focus-visible:ring-accent"
              disabled={isPending}
            />
           </div>
           <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="deadline-picker" className="font-semibold text-md">Deadline</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="deadline-picker"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                        )}
                        disabled={isPending}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="priority-select" className="font-semibold text-md">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)} disabled={isPending}>
                    <SelectTrigger id="priority-select">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
           </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Your Generated Plan
            </Label>
            <Card className="min-h-[24rem] bg-background/50 flex flex-col">
                <CardHeader>
                    {result && <CardTitle className="text-lg">{result.planTitle}</CardTitle>}
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Generating your plan...</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                            <p>Your step-by-step plan will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <div className="w-full h-full flex flex-col gap-4 animate-in fade-in duration-500">
                            <div className="flex items-center gap-4">
                                <Progress value={progress} className="w-full h-3" />
                                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{completedCount} / {totalCount}</span>
                            </div>
                            <ScrollArea className="h-80 w-full pr-4">
                                <ul className="space-y-3">
                                {result.subtasks.map((subtask, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                        <Checkbox 
                                            id={`task-${index}`}
                                            className="mt-1"
                                            checked={checkedTasks[subtask.title]}
                                            onCheckedChange={() => handleTaskCheck(subtask.title)}
                                        />
                                        <div className="grid gap-1.5 leading-snug">
                                            <Label htmlFor={`task-${index}`} className={cn("font-medium", checkedTasks[subtask.title] && "line-through text-muted-foreground")}>{subtask.title}</Label>
                                            <p className={cn("text-xs text-muted-foreground", checkedTasks[subtask.title] && "line-through")}>Due: {format(new Date(subtask.date), "PPP")}</p>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                            </ScrollArea>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleGeneratePlan}
          disabled={!task || !deadline || isPending}
          size="lg"
          className={cn(
            "w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto",
            isPending && "animate-sparkle"
          )}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          <span>{isPending ? "Generating..." : "Generate Plan"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
