
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
import { FeatureTooltip } from "./ui/feature-tooltip";


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts' | 'grammar';

interface VesperAppProps {
  projectId?: string | null;
  initialTab?: string | null;
  initialTopic?: string | null;
}

const allFeatures = [
    { value: 'paraphrase', icon: <Quote className="h-5 w-5" />, label: 'Paraphrase', description: 'Rephrase text to say the same thing in a new way.' },
    { value: 'summarize', icon: <BookText className="h-5 w-5" />, label: 'Summarize', description: 'Condense long text into a short, easy-to-read summary.' },
    { value: 'grammar', icon: <SpellCheck className="h-5 w-5" />, label: 'Grammar', description: 'Check your text for grammatical errors and get corrections.' },
    { value: 'batch-summary', icon: <Rows3 className="h-5 w-5" />, label: 'Batch Summary', description: 'Upload multiple files to get a summary for each one.' },
    { value: 'translate', icon: <Languages className="h-5 w-5" />, label: 'Translate', description: 'Translate text from a document into another language.' },
    { value: 'style', icon: <Palette className="h-5 w-5" />, label: 'Style', description: 'Rewrite text in a different tone or style (e.g., formal).' },
    { value: 'explainer', icon: <BrainCircuit className="h-5 w-5" />, label: 'Explainer', description: 'Break down complex topics into simple, easy steps.' },
    { value: 'diagrams', icon: <Share2 className="h-5 w-5" />, label: 'Diagrams', description: 'Generate diagrams (flowcharts, mindmaps) from a topic.' },
    { value: 'assign-mentor', icon: <PenSquare className="h-5 w-5" />, label: 'Assign-mentor', description: 'Create a well-researched assignment on any topic.' },
    { value: 'note-mentor', icon: <StickyNote className="h-5 w-5" />, label: 'Note-mentor', description: 'Generate structured study notes on any topic.' },
    { value: 'flashcards', icon: <Copy className="h-5 w-5" />, label: 'Flashcards', description: 'Create study flashcards from your notes or a document.' },
    { value: 'citations', icon: <BookA className="h-5 w-5" />, label: 'Citations', description: 'Generate academic citations for your text in various styles.' },
    { value: 'vocabulary', icon: <BookUp className="h-5 w-5" />, label: 'Vocabulary', description: 'Enhance your text with better word choices.' },
    { value: 'tone', icon: <Gauge className="h-5 w-5" />, label: 'Tone', description: 'Analyze the emotional and stylistic tone of your text.' },
    { value: 'video-to-text', icon: <Video className="h-5 w-5" />, label: 'Video to Text', description: 'Transcribe speech from a video file into text.' },
    { value: 'research', icon: <GraduationCap className="h-5 w-5" />, label: 'Research', description: 'Fact-check claims and get citations for your text.' },
    { value: 'plagiarism', icon: <ShieldCheck className="h-5 w-5" />, label: 'Plagiarism', description: 'Check your text for potential plagiarism.' },
    { value: 'tts', icon: <AudioLines className="h-5 w-5" />, label: 'TTS', description: 'Convert text into high-quality spoken audio.' },
    { value: 'formula', icon: <FunctionSquare className="h-5 w-5" />, label: 'Formula', description: 'Render mathematical formulas using LaTeX.' },
    { value: 'notepad', icon: <Notebook className="h-5 w-5" />, label: 'Notepad', description: 'A simple scratchpad for your notes. Saved in your browser.' },
];

export function VesperApp({ projectId, initialTab, initialTopic }: VesperAppProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "paraphrase");
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (initialTab) {
        setActiveTab(initialTab);
    }
  }, [initialTab]);

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
  
  const renderTabTrigger = (value: string, icon: React.ReactNode, label: string, description: string) => {
    return (
      <FeatureTooltip key={value} content={description}>
        <TabsTrigger 
          value={value} 
          className="h-auto py-2.5 flex-1 relative"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              {icon}
              <span className="text-xs sm:text-sm">{label}</span>
          </div>
        </TabsTrigger>
      </FeatureTooltip>
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
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
            <div className="flex md:flex-col gap-2">
                 <FeatureTooltip content="Collaborate with friends and colleagues in shared workspaces.">
                     <Button
                        onClick={() => router.push('/groups')}
                        variant={'outline'}
                        className="w-full justify-start text-base py-6"
                     >
                        <Users className="h-5 w-5 mr-3" />
                        Groups
                     </Button>
                 </FeatureTooltip>
                 <FeatureTooltip content="A special tab for chaining multiple AI operations together.">
                     <Button
                        onClick={() => setActiveTab('workspace')}
                        variant={activeTab === 'workspace' ? 'default' : 'outline'}
                        className="w-full justify-start text-base py-6"
                     >
                        <Wand2 className="h-5 w-5 mr-3" />
                        Workspace
                     </Button>
                 </FeatureTooltip>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mx-auto h-auto p-1.5 flex-wrap">
                    {allFeatures.map(feature => renderTabTrigger(feature.value, feature.icon, feature.label, feature.description))}
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
