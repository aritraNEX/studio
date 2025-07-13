
"use client";

import { useWorkspace } from "@/contexts/workspace-context";
import { OperationTab } from "./operation-tab";
import { Wand2 } from "lucide-react";

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style';

export function WorkspaceTab() {
  const { workspaceText, setWorkspaceText, workspaceOperation, setWorkspaceOperation, setActiveTab } = useWorkspace();

  const handleSendTo = (text: string, operation: Operation) => {
    // In the workspace, sending to another tool just updates the current state
    setWorkspaceText(text);
    setWorkspaceOperation(operation);
  };

  if (!workspaceOperation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40rem] text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
        <Wand2 className="h-16 w-16 mx-auto mb-6 text-primary/50" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to the Workspace</h2>
        <p className="max-w-md">
          This is your area for chained operations. To get started, go to another tab like "Paraphrase", process some text, and then use the "Send to..." button in the result box.
        </p>
      </div>
    );
  }

  return (
    <OperationTab
      key={`${workspaceOperation}-${workspaceText.length}`} // Force re-mount on change
      operation={workspaceOperation}
      initialText={workspaceText}
      onSendTo={handleSendTo}
    />
  );
}
