
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Quote, BookText, Languages, Notebook, Palette, ShieldCheck, Wand2, GraduationCap, AudioLines, FileText, Rows3, FunctionSquare, Video, PenSquare, Copy, BookA, SpellCheck, BrainCircuit, Share2, StickyNote, Gauge, BookUp, Users } from "lucide-react";
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
import { AssignmentMakerTab } from "./assignment-maker-tab";
import { FlashcardGeneratorTab } from "./flashcard-generator-tab";
import { CitationGeneratorTab } from "./citation-generator-tab";
import { GrammarCheckTab } from "./grammar-check-tab";
import { ConceptExplainerTab } from "./concept-explainer-tab";
import { DiagramGeneratorTab } from "./diagram-generator-tab";
import { NoteGeneratorTab } from "./note-generator-tab";
import { ToneDetectionTab } from "./tone-detection-tab";
import { VocabularyEnhancerTab } from "./vocabulary-enhancer-tab";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts' | 'grammar';

interface VesperAppProps {
  projectId?: string | null;
  initialTab?: string | null;
  initialTopic?: string | null;
}

const allFeatures = [
    { value: 'paraphrase', icon: <Quote className="h-5 w-5" />, label: 'Paraphrase' },
    { value: 'summarize', icon: <BookText className="h-5 w-5" />, label: 'Summarize' },
    { value: 'grammar', icon: <SpellCheck className="h-5 w-5" />, label: 'Grammar' },
    { value: 'batch-summary', icon: <Rows3 className="h-5 w-5" />, label: 'Batch Summary' },
    { value: 'translate', icon: <Languages className="h-5 w-5" />, label: 'Translate' },
    { value: 'style', icon: <Palette className="h-5 w-5" />, label: 'Style' },
    { value: 'explainer', icon: <BrainCircuit className="h-5 w-5" />, label: 'Explainer' },
    { value: 'diagrams', icon: <Share2 className="h-5 w-5" />, label: 'Diagrams' },
    { value: 'assign-mentor', icon: <PenSquare className="h-5 w-5" />, label: 'Assign-mentor' },
    { value: 'note-mentor', icon: <StickyNote className="h-5 w-5" />, label: 'Note-mentor' },
    { value: 'flashcards', icon: <Copy className="h-5 w-5" />, label: 'Flashcards' },
    { value: 'citations', icon: <BookA className="h-5 w-5" />, label: 'Citations' },
    { value: 'vocabulary', icon: <BookUp className="h-5 w-5" />, label: 'Vocabulary' },
    { value: 'tone', icon: <Gauge className="h-5 w-5" />, label: 'Tone' },
    { value: 'video-to-text', icon: <Video className="h-5 w-5" />, label: 'Video to Text' },
    { value: 'research', icon: <GraduationCap className="h-5 w-5" />, label: 'Research' },
    { value: 'plagiarism', icon: <ShieldCheck className="h-5 w-5" />, label: 'Plagiarism' },
    { value: 'tts', icon: <AudioLines className="h-5 w-5" />, label: 'TTS' },
    { value: 'formula', icon: <FunctionSquare className="h-5 w-5" />, label: 'Formula' },
    { value: 'notepad', icon: <Notebook className="h-5 w-5" />, label: 'Notepad' },
];

export function VesperApp({ projectId, initialTab, initialTopic }: VesperAppProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "paraphrase");
  const [animatingTab, setAnimatingTab] = useState<string | null>(null);
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setAnimatingTab(value);
    setTimeout(() => setAnimatingTab(null), 2000); // Animation duration
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
  
  return (
     <Card className="w-full max-w-6xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
      <CardHeader className="text-center p-4 sm:p-8 pt-8">
        <div className="mx-auto w-fit mb-4">
            <svg
                width="48"
                height="48"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
              >
                <circle cx="40" cy="40" r="30" className="fill-primary" />
                <circle cx="70" cy="35" r="20" className="fill-primary/70" />
                <circle cx="65" cy="75" r="25" className="fill-accent" />
                <circle cx="80" cy="70" r="10" className="fill-primary" />
              </svg>
        </div>
        
        <CardTitle className="text-3xl sm:text-4xl font-bold tracking-tight">
          Vesper
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground/80">
          Your Ultimate AI-Powered Toolkit
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 sm:p-8 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
            <div className="flex md:flex-col gap-2">
                 <Button
                    onClick={() => router.push('/groups')}
                    variant={'outline'}
                    className="w-full justify-start text-base py-6"
                 >
                    <Users className="h-5 w-5 mr-3" />
                    Groups
                 </Button>
                 <Button
                    onClick={() => handleTabChange('workspace')}
                    variant={activeTab === 'workspace' ? 'default' : 'outline'}
                    className={cn(
                        "w-full justify-start text-base py-6",
                        animatingTab === 'workspace' && 'tab-focus-animation'
                    )}
                 >
                    <Wand2 className="h-5 w-5 mr-3" />
                    Workspace
                 </Button>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                 <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mx-auto h-auto p-1.5 flex-wrap">
                    {allFeatures.map(feature => (
                        <TabsTrigger 
                        key={feature.value}
                        value={feature.value} 
                        className={cn(
                            "h-auto py-2.5 flex-1 relative",
                             animatingTab === feature.value && 'tab-focus-animation'
                        )}
                        >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                            {feature.icon}
                            <span className="text-xs sm:text-sm">{feature.label}</span>
                        </div>
                        </TabsTrigger>
                    ))}
                 </TabsList>
                 
                <div className="mt-6">
                    <TabsContent value="workspace" className="m-0">
                        <WorkspaceTab />
                    </TabsContent>
                    <TabsContent value="paraphrase" className="m-0">
                        <OperationTab operation="paraphrase" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="summarize" className="m-0">
                        <OperationTab operation="summarize" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="grammar" className="m-0">
                        <GrammarCheckTab />
                    </TabsContent>
                    <TabsContent value="batch-summary" className="m-0">
                        <BatchSummaryTab />
                    </TabsContent>
                    <TabsContent value="translate" className="m-0">
                        <OperationTab operation="translate" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="style" className="m-0">
                        <OperationTab operation="style" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="explainer" className="m-0">
                        <ConceptExplainerTab />
                    </TabsContent>
                    <TabsContent value="diagrams" className="m-0">
                        <DiagramGeneratorTab />
                    </TabsContent>
                    <TabsContent value="assign-mentor" className="m-0">
                        <AssignmentMakerTab />
                    </TabsContent>
                    <TabsContent value="note-mentor" className="m-0">
                        <NoteGeneratorTab />
                    </TabsContent>
                    <TabsContent value="flashcards" className="m-0">
                        <FlashcardGeneratorTab />
                    </TabsContent>
                    <TabsContent value="citations" className="m-0">
                        <CitationGeneratorTab />
                    </TabsContent>
                    <TabsContent value="vocabulary" className="m-0">
                        <VocabularyEnhancerTab />
                    </TabsContent>
                    <TabsContent value="tone" className="m-0">
                        <ToneDetectionTab />
                    </TabsContent>
                    <TabsContent value="video-to-text" className="m-0">
                        <TranscriptionTab />
                    </TabsContent>
                    <TabsContent value="research" className="m-0">
                        <ResearchTab />
                    </TabsContent>
                    <TabsContent value="plagiarism" className="m-0">
                        <PlagiarismTab />
                    </TabsContent>
                    <TabsContent value="tts" className="m-0">
                        <TtsTab />
                    </TabsContent>
                    <TabsContent value="formula" className="m-0">
                        <FormulaTab />
                    </TabsContent>
                    <TabsContent value="notepad" className="m-0">
                        <NotepadTab />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
