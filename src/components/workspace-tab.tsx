
"use client";

import { useState, useTransition } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import { processImageText } from "@/ai/flows/paraphrase-image-text";
import { Wand2, Copy, Download, Send, Sparkles, Loader2, ChevronsRight, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Operation, WorkspaceStep } from "@/contexts/workspace-context";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

const allOperations: Operation[] = ['paraphrase', 'summarize', 'translate', 'style'];

interface WorkspaceTabProps {
  onSendTo: (text: string, operation: 'tts') => void;
}

export function WorkspaceTab({ onSendTo }: WorkspaceTabProps) {
  const { workspaceSteps, addWorkspaceStep, removeWorkspaceStep } = useWorkspace();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [nextOperation, setNextOperation] = useState<Operation>('summarize');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [targetStyle, setTargetStyle] = useState('Formal');
  
  const lastStep = workspaceSteps[workspaceSteps.length - 1];

  const handleProcessNextStep = () => {
    if (!lastStep) return;

    startTransition(async () => {
      try {
        const payload: any = {
          operation: nextOperation,
          text: lastStep.text,
        };
        if (nextOperation === 'translate') payload.targetLanguage = targetLanguage;
        if (nextOperation === 'style') payload.targetStyle = targetStyle;

        const result = await processImageText(payload);
        
        if (result && result.processedText) {
          addWorkspaceStep({
            id: Date.now(),
            operation: nextOperation,
            text: result.processedText,
            options: nextOperation === 'translate' ? { lang: targetLanguage } : nextOperation === 'style' ? { style: targetStyle } : undefined,
          });
        } else {
          throw new Error("The AI returned an empty result.");
        }
      } catch (e) {
        console.error(e);
        toast({
          title: "Processing Error",
          description: e instanceof Error ? e.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
  }

  const getStepTitle = (step: WorkspaceStep) => {
    let title = step.operation.charAt(0).toUpperCase() + step.operation.slice(1);
    if (step.operation === 'translate' && step.options?.lang) {
        title += ` (to ${step.options.lang})`
    }
    if (step.operation === 'style' && step.options?.style) {
        title += ` (as ${step.options.style})`
    }
    return title;
  }

  if (workspaceSteps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40rem] text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
        <Wand2 className="h-16 w-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to the Workspace</h2>
        <p className="max-w-md">
          This is your area for chained operations. Send a result from another tab to get started, or chain operations together right here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ScrollArea className="h-[50vh] pr-4">
        <div className="flex flex-col gap-6">
            {workspaceSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{getStepTitle(step)}</CardTitle>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(step.text)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            {index === workspaceSteps.length - 1 && workspaceSteps.length > 1 && (
                                <Button variant="destructive" size="icon" onClick={() => removeWorkspaceStep(step.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Textarea readOnly value={step.text} className="h-32 resize-none bg-background/50" />
                    </CardContent>
                </Card>
                {index < workspaceSteps.length - 1 && (
                     <div className="flex justify-center">
                        <ChevronsRight className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}
                </React.Fragment>
            ))}
        </div>
      </ScrollArea>

      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
            <CardTitle>Next Step</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
           <div className="flex flex-col gap-2">
            <Label>Next Operation</Label>
            <Select value={nextOperation} onValueChange={(v: Operation) => setNextOperation(v)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select an operation" />
                </SelectTrigger>
                <SelectContent>
                    {allOperations.map(op => <SelectItem key={op} value={op}>{op.charAt(0).toUpperCase() + op.slice(1)}</SelectItem>)}
                </SelectContent>
            </Select>
           </div>
           {nextOperation === 'translate' && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                <Label>Target Language</Label>
                <Input value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} />
            </div>
           )}
           {nextOperation === 'style' && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-300">
                <Label>Target Style</Label>
                <Input value={targetStyle} onChange={(e) => setTargetStyle(e.target.value)} placeholder="e.g., Formal, Casual, Shakespearean" />
            </div>
           )}
        </CardContent>
      </Card>

       <div className="flex justify-center pt-4">
        <Button onClick={handleProcessNextStep} disabled={isPending} size="lg" className={cn("text-lg", isPending && "animate-sparkle")}>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2" />}
          {isPending ? "Processing..." : `Run ${nextOperation}`}
        </Button>
      </div>

    </div>
  );
}
