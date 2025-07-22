
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import mermaid from 'mermaid';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { diagramGenerator, DiagramGeneratorOutput } from "@/ai/flows/diagram-generator-flow";
import { Loader2, Sparkles, Download, Copy, Share2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

type DiagramType = 'flowchart' | 'mindmap' | 'concept' | 'timeline';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base', // Use a neutral theme to better fit with app's light/dark modes
  themeVariables: {
    background: '#ffffff', // A light background that works well
    primaryColor: '#f3f4f6',
    primaryTextColor: '#1f2937',
    primaryBorderColor: '#d1d5db',
    lineColor: '#6b7280',
    textColor: '#111827',
  }
});

export function DiagramGeneratorTab() {
  const [topic, setTopic] = useState<string>("");
  const [diagramType, setDiagramType] = useState<DiagramType>("flowchart");
  const [result, setResult] = useState<DiagramGeneratorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [diagramSvg, setDiagramSvg] = useState<string>("");

  useEffect(() => {
    const renderDiagram = async () => {
        if (result?.mermaidSyntax && mermaidRef.current) {
            try {
                mermaidRef.current.innerHTML = ''; // Clear previous diagram
                mermaidRef.current.removeAttribute('data-processed');
                const { svg } = await mermaid.render(`mermaid-graph-${Date.now()}`, result.mermaidSyntax);
                mermaidRef.current.innerHTML = svg;
                setDiagramSvg(svg);
            } catch (e: any) {
                console.error("Mermaid rendering error:", e);
                const friendlyError = "The AI generated invalid diagram syntax. Please try generating again.";
                setError(friendlyError);
                toast({ variant: 'destructive', title: 'Diagram Rendering Error', description: friendlyError });
                if (mermaidRef.current) {
                    mermaidRef.current.innerHTML = `<div class="text-destructive text-center">${friendlyError}</div>`;
                }
            }
        }
    };
    renderDiagram();
  }, [result, toast]);

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic is empty",
        description: "Please enter a topic for the diagram.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);
    setDiagramSvg("");
    if (mermaidRef.current) {
        mermaidRef.current.innerHTML = '';
    }

    startTransition(async () => {
      try {
        const diagramResult = await diagramGenerator({ topic, diagramType });
        setResult(diagramResult);
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate diagram. ${errorMessage}`);
        toast({
          title: "Generation Error",
          description: "An error occurred while creating the diagram. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownloadSvg = () => {
    if (!diagramSvg) return;
    const blob = new Blob([diagramSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}-${diagramType}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded SVG', description: 'The diagram has been saved as an SVG file.' });
  };

  const handleCopyCode = () => {
    if (!result?.mermaidSyntax) return;
    navigator.clipboard.writeText(result.mermaidSyntax);
    toast({ title: 'Copied Mermaid Code', description: 'The syntax has been copied to your clipboard.' });
  };
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <Label htmlFor="diagram-topic" className="text-xl font-bold tracking-tight">
          What would you like to visualize?
        </Label>
        <div className="flex w-full max-w-2xl flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
                id="diagram-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The process of photosynthesis"
                className="bg-background focus-visible:ring-accent text-base h-12 flex-grow"
                disabled={isPending}
            />
             <Select onValueChange={(v: DiagramType) => setDiagramType(v)} defaultValue={diagramType} disabled={isPending}>
                <SelectTrigger className="w-full sm:w-[180px] h-12 bg-background">
                    <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="flowchart">Flowchart</SelectItem>
                    <SelectItem value="mindmap">Mind Map</SelectItem>
                    <SelectItem value="concept">Concept Diagram</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
            </Select>
            <Button
                onClick={handleGenerate}
                disabled={!topic.trim() || isPending}
                size="lg"
                className="h-12 text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
            {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isPending ? "Generating..." : "Generate"}
            </Button>
        </div>
        {error && !isPending && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>

      <Card className="relative w-full min-h-[500px] bg-muted/30 rounded-2xl p-4 sm:p-8 overflow-auto">
        <CardContent className="w-full h-full flex items-center justify-center">
             {isPending && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="font-semibold text-lg">Drawing your diagram...</p>
              </div>
            )}
            {!isPending && !result && (
              <div className="text-center text-muted-foreground p-4 flex flex-col items-center justify-center h-full">
                <Share2 className="h-24 w-24 text-primary/30 mb-4" />
                <p className="text-lg">Your generated diagram will appear here.</p>
              </div>
            )}
            {result && (
                <div 
                    ref={mermaidRef} 
                    className={cn(
                        "w-full h-full flex items-center justify-center animate-in fade-in duration-700",
                        // For mindmaps, ensure the text is visible on both light/dark modes
                        diagramType === 'mindmap' ? '[&_.label]:!fill-foreground' : ''
                    )}
                />
            )}
        </CardContent>
         {result && !isPending && !error && (
             <div className="absolute top-4 right-4 flex gap-2">
                 <Button onClick={handleCopyCode} variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                 </Button>
                <Button onClick={handleDownloadSvg}>
                    <Download className="mr-2 h-4 w-4" />
                    Download SVG
                </Button>
             </div>
         )}
      </Card>
    </div>
  );
}
