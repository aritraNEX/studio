
"use client";

import { useState } from "react";
import Image from "next/image";
import { useWorkspace } from "@/contexts/workspace-context";
import { OperationTab } from "./operation-tab";
import { Wand2, Share2, Loader2, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/auth-context";


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts';

export function WorkspaceTab() {
  const { workspaceText, setWorkspaceText, workspaceOperation, setWorkspaceOperation } = useWorkspace();
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState("");
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSendTo = (text: string, operation: Operation) => {
    setWorkspaceText(text);
    setWorkspaceOperation(operation);
  };

  const handleShare = async () => {
    if (!user || !workspaceOperation || !workspaceText) {
      toast({
        variant: "destructive",
        title: "Nothing to share",
        description: "Please make sure there is content and an operation selected in the workspace.",
      });
      return;
    }
    setIsSharing(true);
    try {
      const docRef = await addDoc(collection(db, "workspaces"), {
        ownerId: user.uid,
        operation: workspaceOperation,
        text: workspaceText,
        createdAt: serverTimestamp(),
      });
      
      const link = `${window.location.origin}/workspace/${docRef.id}`;
      setSharedLink(link);
      setShareModalOpen(true);

    } catch (error) {
      console.error("Error creating share link:", error);
      toast({
        variant: "destructive",
        title: "Sharing Failed",
        description: "Could not create a shareable link. Please try again.",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(sharedLink);
    toast({ title: "Link copied to clipboard!" });
  };


  if (!workspaceOperation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40rem] text-center text-muted-foreground p-8 bg-muted/20 rounded-lg">
        <Image
            src="https://placehold.co/300x200.png"
            alt="Workspace Illustration"
            width={300}
            height={200}
            className="mb-6 rounded-lg"
            data-ai-hint="team collaboration"
        />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to the Workspace</h2>
        <p className="max-w-md">
          This is your area for chained operations. To get started, go to another tab like "Paraphrase", process some text, and then use the "Send to..." button in the result box.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleShare} disabled={isSharing}>
          {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
          {isSharing ? "Generating Link..." : "Share Workspace"}
        </Button>
      </div>
      <OperationTab
        key={`${workspaceOperation}-${workspaceText.length}`} // Force re-mount on change
        operation={workspaceOperation}
        initialText={workspaceText}
        onSendTo={handleSendTo}
      />
      <Dialog open={isShareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your workspace</DialogTitle>
            <DialogDescription>
              Anyone with this private link will be able to view this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Label htmlFor="share-link">Shareable Link</Label>
            <div className="flex items-center gap-2">
              <Input id="share-link" value={sharedLink} readOnly />
              <Button onClick={handleCopyToClipboard} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
