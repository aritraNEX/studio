
"use client";

import { useState, useEffect } from "react";
import { Sparkles, Quote, BookText, Languages, Notebook, Palette, ShieldCheck, Wand2, GraduationCap, AudioLines, FileText, Rows3, FunctionSquare, Video, PenSquare, Copy, BookA, SpellCheck, BrainCircuit, Share2, Crown, StickyNote, Gauge, BookUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts' | 'grammar';

interface VesperAppProps {
  projectId?: string | null;
  initialTab?: string | null;
  initialTopic?: string | null;
}

const mostUsedFeatures = [
    { value: 'paraphrase', icon: <Quote className="h-5 w-5" />, label: 'Paraphrase' },
    { value: 'summarize', icon: <BookText className="h-5 w-5" />, label: 'Summarize' },
    { value: 'grammar', icon: <SpellCheck className="h-5 w-5" />, label: 'Grammar' },
    { value: 'batch-summary', icon: <Rows3 className="h-5 w-5" />, label: 'Batch Summary' },
    { value: 'translate', icon: <Languages className="h-5 w-5" />, label: 'Translate' },
    { value: 'style', icon: <Palette className="h-5 w-5" />, label: 'Style' },
];

const highQualityFeatures = [
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
    { value: 'workspace', icon: <Wand2 className="h-5 w-5" />, label: 'Workspace' },
    { value: 'notepad', icon: <Notebook className="h-5 w-5" />, label: 'Notepad' },
];


export function VesperApp({ projectId, initialTab, initialTopic }: VesperAppProps) {
  const [activeMainTab, setActiveMainTab] = useState("most-used");
  const [activeSubTab, setActiveSubTab] = useState(initialTab || "paraphrase");
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();

  useEffect(() => {
    if (initialTab) {
      if (mostUsedFeatures.some(f => f.value === initialTab)) {
        setActiveMainTab("most-used");
        setActiveSubTab(initialTab);
      } else if (highQualityFeatures.some(f => f.value === initialTab)) {
        setActiveMainTab("high-quality");
        setActiveSubTab(initialTab);
      }
    }
  }, [initialTab]);

  const handleSendTo = (text: string, operation: Operation) => {
    if (operation === 'tts') {
        setWorkspaceText(text);
        setActiveMainTab("high-quality");
        setActiveSubTab("tts");
    } else {
        setWorkspaceText(text);
        setWorkspaceOperation(operation);
        setActiveMainTab("high-quality");
        setActiveSubTab("workspace");
    }
  };
  
  const renderTabTrigger = (value: string, icon: React.ReactNode, label: string) => {
    return (
      <TabsTrigger 
        key={value}
        value={value} 
        className="h-auto py-2.5 flex-1 relative"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
            {icon}
            <span className="text-xs sm:text-sm">{label}</span>
        </div>
      </TabsTrigger>
    );
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
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="most-used">Most Used AI Tools</TabsTrigger>
                <TabsTrigger value="high-quality">High Quality Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="most-used">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full pt-4">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mx-auto h-auto p-1.5 flex-wrap">
                        {mostUsedFeatures.map(feature => renderTabTrigger(feature.value, feature.icon, feature.label))}
                    </TabsList>
                    <TabsContent value="paraphrase" className="pt-6">
                        <OperationTab operation="paraphrase" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="summarize" className="pt-6">
                        <OperationTab operation="summarize" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="grammar" className="pt-6">
                        <GrammarCheckTab />
                    </TabsContent>
                    <TabsContent value="batch-summary" className="pt-6">
                        <BatchSummaryTab />
                    </TabsContent>
                    <TabsContent value="translate" className="pt-6">
                        <OperationTab operation="translate" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="style" className="pt-6">
                        <OperationTab operation="style" onSendTo={handleSendTo} projectId={projectId} />
                    </TabsContent>
                </Tabs>
            </TabsContent>
            
            <TabsContent value="high-quality">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full pt-4">
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 xl:grid-cols-14 mx-auto h-auto p-1.5 flex-wrap">
                        {highQualityFeatures.map(feature => renderTabTrigger(feature.value, feature.icon, feature.label))}
                    </TabsList>
                    <TabsContent value="explainer" className="pt-6">
                        <ConceptExplainerTab />
                    </TabsContent>
                    <TabsContent value="diagrams" className="pt-6">
                        <DiagramGeneratorTab />
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
                    <TabsContent value="vocabulary" className="pt-6">
                        <VocabularyEnhancerTab />
                    </TabsContent>
                    <TabsContent value="tone" className="pt-6">
                        <ToneDetectionTab />
                    </TabsContent>
                    <TabsContent value="video-to-text" className="pt-6">
                        <TranscriptionTab />
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
                    <TabsContent value="formula" className="pt-6">
                        <FormulaTab />
                    </TabsContent>
                    <TabsContent value="workspace" className="pt-6">
                        <WorkspaceTab />
                    </TabsContent>
                    <TabsContent value="notepad" className="pt-6">
                        <NotepadTab />
                    </TabsContent>
                </Tabs>
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
