
"use client";

import { useState } from "react";
import { Sparkles, Quote, BookText, Languages, Notebook, Palette, ShieldCheck, Wand2, GraduationCap, AudioLines, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OperationTab } from "./operation-tab";
import { AdBanner } from "./ad-banner";
import { NotepadTab } from "./notepad-tab";
import { PlagiarismTab } from "./plagiarism-tab";
import { WorkspaceTab } from "./workspace-tab";
import { WorkspaceProvider, useWorkspace } from "@/contexts/workspace-context";
import { ResearchTab } from "./research-tab";
import { TtsTab } from "./tts-tab";
import { TranscriptionTab } from "./transcription-tab";

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts';

function TexioAppContent() {
  const [activeTab, setActiveTab] = useState("paraphrase");
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();

  const handleSendTo = (text: string, operation: Operation) => {
    if (operation === 'tts') {
        setWorkspaceText(text); // Pass text to workspace context for TTS tab to pick up
        setActiveTab("tts");
    } else {
        setWorkspaceText(text);
        setWorkspaceOperation(operation);
        setActiveTab("workspace");
    }
  };

  return (
     <Card className="w-full max-w-5xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-xl p-3 w-fit mb-4 shadow-lg shadow-primary/30">
          <Sparkles className="h-8 w-8" />
        </div>
        <CardTitle className="text-4xl font-bold tracking-tight">Tex.io</CardTitle>
        <CardDescription className="text-lg text-muted-foreground/80">
          Upload an image to magically paraphrase, summarize, or translate its text.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-8 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 mx-auto max-w-6xl h-auto p-1.5">
            <TabsTrigger value="paraphrase" className="py-2.5">
                <Quote className="h-5 w-5 mr-2" />
                <span>Paraphrase</span>
            </TabsTrigger>
            <TabsTrigger value="summarize" className="py-2.5">
                <BookText className="h-5 w-5 mr-2" />
                <span>Summarize</span>
            </TabsTrigger>
            <TabsTrigger value="translate" className="py-2.5">
                <Languages className="h-5 w-5 mr-2" />
                <span>Translate</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="py-2.5">
                <Palette className="h-5 w-5 mr-2" />
                <span>Style</span>
            </TabsTrigger>
            <TabsTrigger value="transcription" className="py-2.5">
                <FileText className="h-5 w-5 mr-2" />
                <span>Transcription</span>
            </TabsTrigger>
             <TabsTrigger value="workspace" className="py-2.5">
                <Wand2 className="h-5 w-5 mr-2" />
                <span>Workspace</span>
            </TabsTrigger>
             <TabsTrigger value="research" className="py-2.5">
                <GraduationCap className="h-5 w-5 mr-2" />
                <span>Research</span>
            </TabsTrigger>
            <TabsTrigger value="plagiarism" className="py-2.5">
                <ShieldCheck className="h-5 w-5 mr-2" />
                <span>Plagiarism</span>
            </TabsTrigger>
             <TabsTrigger value="tts" className="py-2.5">
                <AudioLines className="h-5 w-5 mr-2" />
                <span>TTS</span>
            </TabsTrigger>
            <TabsTrigger value="notepad" className="py-2.5">
                <Notebook className="h-5 w-5 mr-2" />
                <span>Notepad</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="paraphrase" className="pt-6">
            <OperationTab operation="paraphrase" onSendTo={handleSendTo} />
          </TabsContent>
          <TabsContent value="summarize" className="pt-6">
            <OperationTab operation="summarize" onSendTo={handleSendTo} />
          </TabsContent>
          <TabsContent value="translate" className="pt-6">
            <OperationTab operation="translate" onSendTo={handleSendTo} />
          </TabsContent>
          <TabsContent value="style" className="pt-6">
            <OperationTab operation="style" onSendTo={handleSendTo} />
          </TabsContent>
          <TabsContent value="transcription" className="pt-6">
            <TranscriptionTab />
          </TabsContent>
          <TabsContent value="workspace" className="pt-6">
            <WorkspaceTab />
          </TabsContent>
          <TabsContent value="research" className="pt-6">
            <ResearchTab />
          </TabsContent>
           <TabsContent value="plagiarism" className="pt-6">
            <PlagiarismTab />
          </TabsContent>
           <TabsContent value="tts" className="pt-6">
            <TtsTab />
          </TabsContent>
          <TabsContent value="notepad" className="pt-6">
            <NotepadTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


export function TexioApp() {
  return (
    <WorkspaceProvider>
      <TexioAppContent />
    </WorkspaceProvider>
  )
}
