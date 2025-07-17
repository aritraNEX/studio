
"use client";

import { useState, useTransition } from "react";
import { PenSquare, Loader2, Sparkles, Download, Copy, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { noteGenerator, NoteGeneratorOutput } from "@/ai/flows/note-generator-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import jsPDF from "jspdf";

export function NoteGeneratorTab() {
  const [topic, setTopic] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [result, setResult] = useState<NoteGeneratorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateNotes = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic is empty",
        description: "Please enter a topic for the notes.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const noteResult = await noteGenerator({ topic, instructions });
        if (noteResult) {
          setResult(noteResult);
        } else {
          throw new Error("The note generator returned no result.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate notes. ${errorMessage}`);
        toast({
          title: "Note Generation Error",
          description: "An error occurred while generating the notes. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard!",
      description: `The notes have been copied.`,
    });
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Set Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(result.title, 14, 22);

    // Set Document Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    // Split markdown content by lines to handle bolding
    const lines = result.content.split('\n');
    let yPos = 32;

    lines.forEach(line => {
        if (yPos > 270) { // Add new page if content overflows
            doc.addPage();
            yPos = 22;
        }

        // Simple markdown parser for bold text
        const parts = line.split('**');
        let xPos = 14;

        parts.forEach((part, index) => {
            doc.setFont('helvetica', index % 2 === 1 ? 'bold' : 'normal');
            
            // Check if the part fits on the current line
            const textWidth = doc.getTextWidth(part);
            if (xPos + textWidth > 196) { // 210mm page width - 14mm margins
                yPos += 7;
                xPos = 14;
            }

            doc.text(part, xPos, yPos);
            xPos += doc.getTextWidth(part);
        });

        yPos += 7; // Move to the next line
    });

    doc.save(`note-mentor-${result.title.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="note-topic" className="font-semibold text-md">
            Note Topic
          </Label>
          <Input
            id="note-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Quantum Mechanics for Beginners"
            className="bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
           <Label htmlFor="note-instructions" className="font-semibold text-md">
            Optional Instructions
          </Label>
          <Textarea
            id="note-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Explain key concepts with analogies. Keep it concise."
            className="h-72 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Generated Notes
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardContent className="flex-grow flex items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Generating your notes...</p>
                            <p className="text-sm text-center">The AI is researching and writing.</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                             <p>Your generated notes will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <ScrollArea className="h-[32rem] w-full">
                            <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500 pr-4">
                                <h2 className="text-2xl font-bold tracking-tight">{result.title}</h2>
                                {/* A simple way to render markdown bolding */}
                                <div className="text-base text-foreground whitespace-pre-wrap font-serif">
                                  {result.content.split('**').map((text, index) => 
                                    index % 2 === 1 ? <strong key={index}>{text}</strong> : <span key={index}>{text}</span>
                                  )}
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
         {result && !isPending && (
            <div className="flex flex-wrap items-center justify-center gap-4">
                 <Button
                    onClick={() => handleCopy(result.content)}
                    variant="outline"
                    size="lg"
                    className="transition-all duration-300 hover:scale-105"
                >
                    <Copy className="mr-2 h-5 w-5" />
                    Copy Notes
                </Button>
                <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    size="lg"
                    className="transition-all duration-300 hover:scale-105"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
            </div>
         )}
        <Button
          onClick={handleGenerateNotes}
          disabled={!topic.trim() || isPending}
          size="lg"
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 sm:w-auto mt-4"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isPending ? "Generating..." : "Generate Notes"}
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
