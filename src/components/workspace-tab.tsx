
"use client";

import { useState } from "react";
import Image from "next/image";
import { useWorkspace } from "@/contexts/workspace-context";
import { OperationTab } from "./operation-tab";
import { Wand2, Share2, Loader2, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts' | 'grammar';

export function WorkspaceTab() {
  const { workspaceText, setWorkspaceText, workspaceOperation, setWorkspaceOperation } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSendTo = (text: string, operation: Operation) => {
    setWorkspaceText(text);
    setWorkspaceOperation(operation);
  };

  if (!workspaceOperation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40rem] text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
        <Wand2 className="h-16 w-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to the Workspace</h2>
        <p className="max-w-md">
          This is your area for chained operations. To get started, go to another tab like "Paraphrase", process some text, and then use the "Send to..." button in the result box.
        </p>
      </div>
    );
  }

  return (
    <div>
      <OperationTab
        key={`${workspaceOperation}-${workspaceText.length}`} // Force re-mount on change
        operation={workspaceOperation}
        initialText={workspaceText}
        onSendTo={handleSendTo}
      />
    </div>
  );
}
