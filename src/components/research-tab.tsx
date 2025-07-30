
"use client";

import { useState, useTransition, useRef } from "react";
import { GraduationCap, Loader2, Sparkles, Copy, FileText, BookCheck, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { researchAssistant, ResearchAssistantOutput } from "@/ai/flows/research-assistant-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function ResearchTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchAssistantOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setInputText("");
    setFileDataUri(null);
    setFileName(null);
    const dataUri = await fileToDataUri(file);
    setFileDataUri(dataUri);
    setFileName(file.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };


  const handleResearch = () => {
    if (!inputText.trim() && !fileDataUri) {
      toast({
        title: "Input is empty",
        description: "Please enter some text or upload a file to research.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const researchResult = await researchAssistant({
          text: inputText,
          fileUrl: fileDataUri || undefined,
        });
        if (researchResult) {
          setResult(researchResult);
        } else {
          throw new Error("The research assistant returned no result.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to perform research. ${errorMessage}`);
        toast({
          title: "Research Error",
          description: "An error occurred while researching the text. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleCopy = (textToCopy: string, title: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard!",
      description: `${title} have been copied.`,
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

      const drawTextWithWrapping = async (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; isBold?: boolean; }) => {
        const { font, size, color, lineHeight, x, maxWidth } = options;
        const words = text.split(' ');
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, size);

            if (textWidth > maxWidth) {
                 if (y < lineHeight + margin) {
                    page = pdfDoc.addPage();
                    y = height - margin;
                }
                page.drawText(currentLine, { x, y, font, size, color, lineHeight });
                y -= lineHeight;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
             if (y < lineHeight + margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
            page.drawText(currentLine, { x, y, font, size, color, lineHeight });
            y -= lineHeight;
        }
      };
      
      // Report
      await drawTextWithWrapping('Fact-Check Report', { font: helveticaBoldFont, size: 14, color: rgb(0,0,0), lineHeight: 18, x: margin, maxWidth: width - 2*margin });
      y -= 5;
      await drawTextWithWrapping(result.report, { font: helveticaFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2 * margin });
      y -= 20;

      // Citations
      if (result.citations.length > 0) {
        if (y < margin + 40) {
            page = pdfDoc.addPage();
            y = height - margin;
        }
        await drawTextWithWrapping('Generated Citations (APA)', { font: helveticaBoldFont, size: 14, color: rgb(0,0,0), lineHeight: 18, x: margin, maxWidth: width - 2*margin });
        y -= 10;

        for (const ref of result.citations) {
           await drawTextWithWrapping(`- ${ref}`, { font: helveticaFont, size: 10, color: rgb(0.3, 0.3, 0.3), lineHeight: 14, x: margin, maxWidth: width - 2*margin });
           y -= 5;
        }
      }

      const pages = pdfDoc.getPages();
      for (const pdfPage of pages) {
        const { width, height } = pdfPage.getSize();
        pdfPage.drawText('Vesper', {
          x: width / 2,
          y: height / 2,
          font: helveticaFont,
          size: 100,
          color: rgb(0.85, 0.85, 0.95),
          opacity: 0.2,
          rotate: degrees(-45),
          xSkew: degrees(-15),
          ySkew: degrees(-15),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vesper-research-report.pdf`;
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
            <Label className="font-semibold text-md">Input</Label>
            <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                className={cn(
                    "flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-xl transition-all duration-300",
                    isDragging
                        ? "border-primary bg-primary/20"
                        : "border-primary/20 hover:border-primary bg-primary/10",
                    fileName ? "border-solid border-primary/50" : ""
                )}
            >
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary cursor-pointer" onClick={() => fileInputRef.current?.click()}>Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT files</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="sr-only" accept=".pdf,.docx,.txt" />
                </div>
                {fileName && (
                    <div className="flex items-center gap-2 text-sm font-medium bg-muted p-2 rounded-md">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{fileName}</span>
                    </div>
                )}
            </div>

            <div className="relative flex items-center justify-center my-2">
                <div className="flex-grow border-t border-muted-foreground/20"></div>
                <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
                <div className="flex-grow border-t border-muted-foreground/20"></div>
            </div>

            <Textarea
                id="research-input"
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setFileDataUri(null); setFileName(null); }}
                placeholder="Paste or type text here. The AI will analyze the claims and provide citations..."
                className="h-60 resize-y bg-background focus-visible:ring-accent"
                disabled={isPending || !!fileDataUri}
            />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Research Report
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardContent className="flex-grow flex items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Researching your text...</p>
                            <p className="text-sm text-center">This may take a moment.</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                             <p>Your research report and citations will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <ScrollArea className="h-[24rem] w-full">
                            <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pr-4">
                                 <div className="flex justify-end">
                                    <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Report PDF
                                    </Button>
                                 </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5"/> Fact-Check Report</h3>
                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(result.report, 'Report')}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap font-mono">
                                        {result.report}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><BookCheck className="h-5 w-5"/> Generated Citations (APA)</h3>
                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(result.citations.join('\n\n'), 'Citations')}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <ul className="text-sm text-muted-foreground bg-muted p-4 rounded-md space-y-2 list-none font-mono">
                                        {result.citations.length > 0 ? (
                                            result.citations.map((citation, index) => (
                                            <li key={index}>{citation}</li>
                                            ))
                                        ) : (
                                            <li>No citations could be generated for the provided text.</li>
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
        <Button
          onClick={handleResearch}
          disabled={(!inputText.trim() && !fileDataUri) || isPending}
          size="lg"
          className={cn(
            "w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto",
            isPending && "animate-sparkle"
          )}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          <span>{isPending ? "Researching..." : "Start Research"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
