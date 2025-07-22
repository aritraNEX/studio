
"use client";

import { useState, useTransition } from "react";
import mermaid from 'mermaid';
import { PenSquare, Loader2, Sparkles, Download, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { noteGenerator, NoteGeneratorOutput } from "@/ai/flows/note-generator-flow";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cn } from "@/lib/utils";

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
        let errorMessage = "An unknown error occurred.";
        if (e instanceof Error) {
            if (e.message.includes('overloaded')) {
                errorMessage = "The AI model is currently busy. Please try again in a moment.";
            } else {
                errorMessage = e.message;
            }
        }
        setError(`Failed to generate notes. ${errorMessage}`);
        toast({
          title: "Note Generation Error",
          description: errorMessage,
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

  const handleDownloadPdf = async () => {
    if (!result) return;
     try {
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

      const drawTextWithWrapping = (text: string, options: any) => {
        const { font, size, color, lineHeight, x, maxWidth } = options;
        const words = text.split(' ');
        let currentLine = '';
        const lines = [];

        for(const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            if (font.widthOfTextAtSize(testLine, size) > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        for (const line of lines) {
            if (y < margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
            page.drawText(line, { x, y, font, size, color, lineHeight });
            y -= lineHeight;
        }
        return y;
      };

      // Draw Title
      y = drawTextWithWrapping(result.title, { font: helveticaBoldFont, size: 18, color: rgb(0,0,0), lineHeight: 22, x: margin, maxWidth: width - 2 * margin });
      y -= 15;

      // Draw Content
      const contentParts = result.content.split(/(\*\*.*?\*\*)/g);
      for(const part of contentParts) {
        if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            y = drawTextWithWrapping(boldText, { font: helveticaBoldFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2 * margin });
        } else {
            y = drawTextWithWrapping(part, { font: helveticaFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2 * margin });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `note-mentor-${result.title.replace(/\s+/g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "Could not create the PDF file. Please try again."
        });
    }
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
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto mt-4"
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
