
"use client";

import { useState, useTransition } from "react";
import { PenSquare, Loader2, Sparkles, Download, Copy, FileText, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { assignmentMaker, AssignmentMakerOutput } from "@/ai/flows/assignment-maker-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export function AssignmentMakerTab() {
  const [topic, setTopic] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [result, setResult] = useState<AssignmentMakerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateAssignment = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic is empty",
        description: "Please enter a topic for the assignment.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const assignmentResult = await assignmentMaker({ topic, instructions });
        if (assignmentResult) {
          setResult(assignmentResult);
        } else {
          throw new Error("The assignment maker returned no result.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate assignment. ${errorMessage}`);
        toast({
          title: "Assignment Error",
          description: "An error occurred while generating the assignment. Please try again.",
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
      description: `The assignment text has been copied.`,
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
          if (y < margin) {
            page = pdfDoc.addPage();
            y = height - margin;
          }
          const { font, size, color, lineHeight, x, maxWidth } = options;
          const words = text.split(' ');
          let currentLine = '';

          for (const word of words) {
              const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
              const textWidth = font.widthOfTextAtSize(testLine, size);

              if (textWidth > maxWidth) {
                  page.drawText(currentLine, { x, y, font, size, color, lineHeight });
                  y -= lineHeight;
                  currentLine = word;
                  if (y < margin) {
                      page = pdfDoc.addPage();
                      y = height - margin;
                  }
              } else {
                  currentLine = testLine;
              }
          }
          if (currentLine) {
              page.drawText(currentLine, { x, y, font, size, color, lineHeight });
              y -= lineHeight;
          }
      };

      // Title
      drawTextWithWrapping(result.title, { font: helveticaBoldFont, size: 18, color: rgb(0,0,0), lineHeight: 22, x: margin, maxWidth: width - 2*margin });
      y -= 20;

      // Content
      const contentLines = result.content.split('\n');
      for (const line of contentLines) {
        drawTextWithWrapping(line, { font: helveticaFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2*margin });
      }
      y -= 10;
      
      // References
      if (result.references.length > 0) {
        if (y < margin + 20) {
            page.addPage();
            y = height - margin;
        }
        drawTextWithWrapping('References', { font: helveticaBoldFont, size: 14, color: rgb(0,0,0), lineHeight: 18, x: margin, maxWidth: width - 2*margin });
        y -= 10;

        for (const ref of result.references) {
           drawTextWithWrapping(`- ${ref}`, { font: helveticaFont, size: 10, color: rgb(0.3, 0.3, 0.3), lineHeight: 12, x: margin, maxWidth: width - 2*margin });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `assign-mentor-${result.title.replace(/\s+/g, '-')}.pdf`;
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
          <Label htmlFor="assignment-topic" className="font-semibold text-md">
            Assignment Topic
          </Label>
          <Input
            id="assignment-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The impact of AI on modern education"
            className="bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
           <Label htmlFor="assignment-instructions" className="font-semibold text-md">
            Optional Instructions
          </Label>
          <Textarea
            id="assignment-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Focus on the benefits and challenges. Include at least 3 references. The tone should be academic."
            className="h-72 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Generated Assignment
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardContent className="flex-grow flex items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Generating your assignment...</p>
                            <p className="text-sm text-center">The AI is researching and writing.</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                             <p>Your generated assignment will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <ScrollArea className="h-[32rem] w-full">
                            <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500 pr-4">
                                <h2 className="text-2xl font-bold tracking-tight">{result.title}</h2>
                                <p className="text-base text-foreground whitespace-pre-wrap font-serif">
                                    {result.content}
                                </p>
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mt-4 mb-2"><BookCheck className="h-5 w-5"/> References</h3>
                                    <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 font-mono">
                                        {result.references.length > 0 ? (
                                            result.references.map((ref, index) => (
                                            <li key={index}>{ref}</li>
                                            ))
                                        ) : (
                                            <li>No references were generated.</li>
                                        )}
                                    </ul>
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
                    Copy Text
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
          onClick={handleGenerateAssignment}
          disabled={!topic.trim() || isPending}
          size="lg"
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto mt-4"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isPending ? "Generating..." : "Generate Assignment"}
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
