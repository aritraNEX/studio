
"use client";

import { useState, useTransition, useEffect } from "react";
import { ListTodo, Loader2, Sparkles, Calendar as CalendarIcon, Clock, Download, CalendarPlus, Bell, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { taskPlanner, TaskPlannerOutput } from "@/ai/flows/task-planner-flow";
import { rescheduleTasks } from "@/ai/flows/reschedule-task-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { SpeechRecognitionButton } from "./speech-recognition-button";

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export function TaskPlannerTab() {
  const [task, setTask] = useState<string>("");
  const [deadline, setDeadline] = useState<Date>();
  const [priority, setPriority] = useState<"Medium" | "Low" | "High">("Medium");
  const [availability, setAvailability] = useState({ start: "09:00", end: "17:00" });
  
  const [result, setResult] = useState<TaskPlannerOutput | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition({
      onTranscript: (transcript) => {
        setTask(transcript);
      }
  });

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.taskPlan) {
              setResult(data.taskPlan.plan);
              setCheckedTasks(data.taskPlan.progress || {});
              setTask(data.taskPlan.mainTask);
            }
        } else {
            setResult(null);
            setCheckedTasks({});
        }
    });
    return () => unsubscribe();
  }, [user]);

  const savePlan = async (plan: TaskPlannerOutput | null, progress?: Record<string, boolean>) => {
      if (!user) return;
      const userDocRef = doc(db, 'users', user.uid);
      if (plan === null) {
          await updateDoc(userDocRef, { taskPlan: null });
      } else {
          await updateDoc(userDocRef, { 
            taskPlan: {
              mainTask: task,
              plan,
              progress: progress || checkedTasks,
            }
          });
      }
  };

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
          dailyAvailability: availability,
        });
        if (planResult && planResult.subtasks.length > 0) {
          setResult(planResult);
          savePlan(planResult, {});
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

  const handleReschedule = () => {
    if (!result) return;

    const incompleteTasks = result.subtasks.filter(t => !checkedTasks[t.title]);
    if (incompleteTasks.length === 0) {
        toast({ title: "All tasks complete!", description: "Nothing to reschedule." });
        return;
    }

    setIsRescheduling(true);
    startTransition(async () => {
        try {
            const newPlan = await rescheduleTasks({
                incompleteTasks: incompleteTasks.map(t => t.title),
                deadline: deadline?.toISOString() || result.subtasks[result.subtasks.length - 1].date,
                dailyAvailability: availability
            });
            const updatedPlan = {
                ...result,
                subtasks: [
                    ...result.subtasks.filter(t => checkedTasks[t.title]),
                    ...newPlan.rescheduledTasks
                ]
            };
            updatedPlan.subtasks.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
            setResult(updatedPlan);
            savePlan(updatedPlan);
        } catch (e) {
            toast({ variant: "destructive", title: "Rescheduling Failed", description: e instanceof Error ? e.message : "Unknown error" });
        } finally {
            setIsRescheduling(false);
        }
    });
  }

  const handleDeletePlan = async () => {
      if (!user) return;
      await savePlan(null);
      setResult(null);
      setCheckedTasks({});
      setTask("");
      toast({ title: "Plan Deleted", description: "Your schedule has been cleared." });
  }

  const handleTaskCheck = (taskTitle: string) => {
    const newProgress = {
        ...checkedTasks,
        [taskTitle]: !checkedTasks[taskTitle]
    };
    setCheckedTasks(newProgress);
    savePlan(result, newProgress);
  };
  
  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 40;
      let y = height - margin;

      const drawText = (text: string, x: number, yPos: number, font: any, size: number) => {
        if (yPos < margin) {
            page = pdfDoc.addPage();
            yPos = height - margin;
        }
        page.drawText(text, { x, y: yPos, font, size, color: rgb(0,0,0) });
        return yPos - size * 1.5;
      };
      
      y = drawText(result.planTitle, margin, y, helveticaBoldFont, 18);
      y -= 10;
      
      for(const subtask of result.subtasks) {
          if (y < margin + 40) {
              page = pdfDoc.addPage();
              y = height - margin;
          }
          y = drawText(`${subtask.title} (${subtask.duration} mins)`, margin, y, helveticaBoldFont, 12);
          y = drawText(`Scheduled for: ${format(new Date(`${subtask.date}T${subtask.time}`), 'PPP, p')}`, margin + 10, y, helveticaFont, 10);
          y -= 5;
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vesper-plan-${result.planTitle.replace(/\s/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: "Plan Downloaded", description: "Your schedule has been exported to PDF." });
    } catch (e) {
        console.error(e);
        toast({ title: "PDF Export Failed", variant: "destructive" });
    }
  };
  
  const handleCalendarSync = () => {
      toast({
          title: "Coming Soon!",
          description: "Google Calendar integration is under development. Thank you for your patience."
      })
  }

  const completedCount = Object.values(checkedTasks).filter(Boolean).length;
  const totalCount = result?.subtasks.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isPlanActive = result && result.subtasks.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Input Section */}
        <div className="flex flex-col gap-6 p-6 border rounded-lg bg-card shadow-sm">
           <div className="space-y-2">
            <Label htmlFor="task-input" className="font-semibold text-md">Main Task or Goal</Label>
             <div className="relative">
                <Input
                  id="task-input"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="e.g., Launch a new marketing campaign"
                  className="bg-background focus-visible:ring-accent pr-10"
                  disabled={isPending}
                />
                 {hasSupport && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <SpeechRecognitionButton isListening={isListening} onClick={toggleListening} />
                    </div>
                 )}
            </div>
           </div>
           <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="deadline-picker" className="font-semibold text-md">Deadline</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="deadline-picker"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                        disabled={isPending}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus disabled={(date) => date < new Date() || date < new Date("1900-01-01")} />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="priority-select" className="font-semibold text-md">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)} disabled={isPending}>
                    <SelectTrigger id="priority-select"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
           </div>
           <div className="space-y-2">
               <Label className="font-semibold text-md">Daily Availability</Label>
               <div className="grid grid-cols-2 gap-2">
                    <Select value={availability.start} onValueChange={(v) => setAvailability(p => ({...p, start: v}))}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {timeSlots.map(t => <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={availability.end} onValueChange={(v) => setAvailability(p => ({...p, end: v}))}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {timeSlots.map(t => <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
               </div>
           </div>
           <Button
              onClick={handleGeneratePlan}
              disabled={!task || !deadline || isPending}
              size="lg"
              className={cn(
                "w-full text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95",
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
            {error && <p className="text-sm text-destructive text-center mt-2">{error}</p>}
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Your Generated Plan
            </Label>
            <Card className="min-h-[28rem] bg-background/50 flex flex-col">
                <CardHeader>
                    {result && <CardTitle className="text-lg flex justify-between items-center">{result.planTitle}
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf}><Download className="h-4 w-4 mr-2"/>PDF</Button>
                        <Button variant="outline" size="sm" onClick={handleDeletePlan}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                    </CardTitle>}
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
                    {(isPending || isRescheduling) ? (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">{isRescheduling ? "Rescheduling your plan..." : "Generating your plan..."}</p>
                        </div>
                    ) : !result ? (
                         <div className="text-center text-muted-foreground p-4">
                            <p>Your step-by-step plan will appear here.</p>
                        </div>
                    ) : (
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
                                            checked={!!checkedTasks[subtask.title]}
                                            onCheckedChange={() => handleTaskCheck(subtask.title)}
                                        />
                                        <div className="grid gap-1.5 leading-snug">
                                            <Label htmlFor={`task-${index}`} className={cn("font-medium", checkedTasks[subtask.title] && "line-through text-muted-foreground")}>{subtask.title}</Label>
                                            <p className={cn("text-xs text-muted-foreground flex items-center gap-2", checkedTasks[subtask.title] && "line-through")}>
                                                <CalendarIcon className="h-3 w-3"/>
                                                {format(new Date(subtask.date), "EEE, MMM d")}
                                                <Clock className="h-3 w-3 ml-2"/>
                                                {subtask.time} ({subtask.duration}m)
                                            </p>
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
      {isPlanActive && (
        <Card className="md:col-span-2">
            <CardHeader><CardTitle>Plan Management</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" onClick={handleReschedule} disabled={isPending || isRescheduling}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reschedule Incomplete Tasks
                </Button>
                <Button variant="outline" onClick={handleCalendarSync}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Sync to Google Calendar
                </Button>
                <div className="flex items-center space-x-2">
                    <Checkbox id="email-reminders" />
                    <label htmlFor="email-reminders" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Email Reminders
                    </label>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
