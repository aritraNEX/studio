
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Quote, BookText, Languages, Notebook, Palette, ShieldCheck, Wand2, GraduationCap, AudioLines, FileText, Rows3, FunctionSquare, Video, PenSquare, Copy, BookA, SpellCheck, BrainCircuit, Share2, Crown, StickyNote } from "lucide-react";
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
import { NotepadTab } from "./notepad-tab";
import { PlagiarismTab } from "./plagiarism-tab";
import { WorkspaceTab } from "./workspace-tab";
import { useWorkspace } from "@/contexts/workspace-context";
import { ResearchTab } from "./research-tab";
import { TtsTab } from "./tts-tab";
import { TranscriptionTab } from "./transcription-tab";
import { BatchSummaryTab } from "./batch-summary-tab";
import { FormulaTab } from "./formula-tab";
import { AITooltip } from "./ui/ai-tooltip";
import { AssignmentMakerTab } from "./assignment-maker-tab";
import { FlashcardGeneratorTab } from "./flashcard-generator-tab";
import { CitationGeneratorTab } from "./citation-generator-tab";
import { GrammarCheckTab } from "./grammar-check-tab";
import { ConceptExplainerTab } from "./concept-explainer-tab";
import { DiagramGeneratorTab } from "./diagram-generator-tab";
import { useSubscription } from "@/contexts/subscription-context";
import { PremiumModal } from "./premium-modal";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { NoteGeneratorTab } from "./note-generator-tab";


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts' | 'grammar';

interface TexioAppProps {
  projectId?: string | null;
  initialTab?: string | null;
  initialTopic?: string | null;
}

const freeFeatures = ['paraphrase', 'summarize', 'translate'];

export function TexioApp({ projectId, initialTab, initialTopic }: TexioAppProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "paraphrase");
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();
  const { isPremium } = useSubscription();
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);

  useEffect(() => {
      if (initialTab) {
          setActiveTab(initialTab);
      }
  }, [initialTab]);

  const handleTabChange = (newTab: string) => {
    if (!freeFeatures.includes(newTab) && !isPremium) {
      setPremiumModalOpen(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleSendTo = (text: string, operation: Operation) => {
    if (operation === 'tts') {
        setWorkspaceText(text);
        setActiveTab("tts");
    } else {
        setWorkspaceText(text);
        setWorkspaceOperation(operation);
        setActiveTab("workspace");
    }
  };
  
  const renderTabTrigger = (value: string, icon: React.ReactNode, label: string) => {
    const isPremiumFeature = !freeFeatures.includes(value);
    return (
      <TabsTrigger 
        value={value} 
        className="py-2.5 flex-1"
        onClick={(e) => {
          if (isPremiumFeature && !isPremium) {
            e.preventDefault();
            setPremiumModalOpen(true);
          }
        }}
      >
        <div className="flex items-center justify-center gap-2">
            {icon}
            <span className="hidden sm:inline-block">{label}</span>
        </div>
      </TabsTrigger>
    );
  };


  return (
     <Card className="w-full max-w-6xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
      <CardHeader className="text-center pt-8">
        <div className="flex justify-between items-start mb-4">
            {!isPremium ? (
              <Button variant="secondary" onClick={() => setPremiumModalOpen(true)} className="bg-yellow-400/80 text-yellow-900 hover:bg-yellow-400 invisible">
                <Crown className="mr-2 h-4 w-4"/>
                Go Premium
              </Button>
            ) : <div/>}
            <div className="mx-auto bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-xl p-3 w-fit shadow-lg shadow-primary/30">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="w-28"/> {/* Spacer to balance the header */}
        </div>

        {!isPremium && (
          <div className="flex justify-center mb-4">
            <Button variant="secondary" onClick={() => setPremiumModalOpen(true)} className="bg-yellow-400/80 text-yellow-900 hover:bg-yellow-400">
              <Crown className="mr-2 h-4 w-4"/>
              Go Premium
            </Button>
          </div>
        )}
        
        <CardTitle className="text-4xl font-bold tracking-tight">Tex.io Editor</CardTitle>
        <CardDescription className="text-lg text-muted-foreground/80">
          Your all-in-one AI-powered text and media toolkit.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-8 pt-2">
        <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setPremiumModalOpen(false)} />
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mx-auto h-auto p-1.5 flex-wrap">
            {renderTabTrigger("paraphrase", <Quote className="h-5 w-5" />, "Paraphrase")}
            {renderTabTrigger("summarize", <BookText className="h-5 w-5" />, "Summarize")}
            {renderTabTrigger("translate", <Languages className="h-5 w-5" />, "Translate")}
            {renderTabTrigger("explainer", <BrainCircuit className="h-5 w-5" />, "Explainer")}
            {renderTabTrigger("diagrams", <Share2 className="h-5 w-5" />, "Diagrams")}
            {renderTabTrigger("grammar", <SpellCheck className="h-5 w-5" />, "Grammar")}
            {renderTabTrigger("batch-summary", <Rows3 className="h-5 w-5" />, "Batch Summary")}
            {renderTabTrigger("style", <Palette className="h-5 w-5" />, "Style")}
            {renderTabTrigger("assign-mentor", <PenSquare className="h-5 w-5" />, "Assign-mentor")}
            {renderTabTrigger("note-mentor", <StickyNote className="h-5 w-5" />, "Note-mentor")}
            {renderTabTrigger("flashcards", <Copy className="h-5 w-5" />, "Flashcards")}
            {renderTabTrigger("citations", <BookA className="h-5 w-5" />, "Citations")}
            {renderTabTrigger("formula", <FunctionSquare className="h-5 w-5" />, "Formula")}
            {renderTabTrigger("video-to-text", <Video className="h-5 w-5" />, "Video to Text")}
            <AITooltip>
              {renderTabTrigger("workspace", <Wand2 className="h-5 w-5" />, "Workspace")}
            </AITooltip>
            {renderTabTrigger("research", <GraduationCap className="h-5 w-5" />, "Research")}
            {renderTabTrigger("plagiarism", <ShieldCheck className="h-5 w-5" />, "Plagiarism")}
            {renderTabTrigger("tts", <AudioLines className="h-5 w-5" />, "TTS")}
            {renderTabTrigger("notepad", <Notebook className="h-5 w-5" />, "Notepad")}
          </TabsList>
          <TabsContent value="paraphrase" className="pt-6">
            <OperationTab operation="paraphrase" onSendTo={handleSendTo} projectId={projectId} />
          </TabsContent>
          <TabsContent value="summarize" className="pt-6">
            <OperationTab operation="summarize" onSendTo={handleSendTo} projectId={projectId} />
          </TabsContent>
          <TabsContent value="translate" className="pt-6">
            <OperationTab operation="translate" onSendTo={handleSendTo} projectId={projectId} />
          </TabsContent>
          <TabsContent value="explainer" className="pt-6">
            <ConceptExplainerTab />
          </TabsContent>
           <TabsContent value="diagrams" className="pt-6">
            <DiagramGeneratorTab />
          </TabsContent>
           <TabsContent value="grammar" className="pt-6">
            <GrammarCheckTab />
          </TabsContent>
          <TabsContent value="batch-summary" className="pt-6">
            <BatchSummaryTab />
          </TabsContent>
          <TabsContent value="style" className="pt-6">
            <OperationTab operation="style" onSendTo={handleSendTo} projectId={projectId} />
          </TabsContent>
          <TabsContent value="assign-mentor" className="pt-6">
            <AssignmentMakerTab />
          </TabsContent>
           <TabsContent value="note-mentor" className="pt-6">
            <NoteGeneratorTab />
          </TabsContent>
          <TabsContent value="flashcards" className="pt-6">
            <FlashcardGeneratorTab />
          </TabsContent>
          <TabsContent value="citations" className="pt-6">
            <CitationGeneratorTab />
          </TabsContent>
          <TabsContent value="formula" className="pt-6">
            <FormulaTab />
          </TabsContent>
           <TabsContent value="video-to-text" className="pt-6">
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
  );
}
