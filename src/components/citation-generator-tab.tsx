
"use client";

import { useState, useTransition, useRef } from "react";
import { Loader2, Sparkles, Copy, BookA, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { citationGenerator, CitationGeneratorOutput } from "@/ai/flows/citation-generator-flow";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

type CitationStyle = 'APA' | 'MLA' | 'Chicago';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function CitationGeneratorTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("APA");
  const [result, setResult] = useState<CitationGeneratorOutput | null>(null);
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

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };


  const handleGenerate = () => {
    if (!inputText.trim() && !fileDataUri) {
      toast({
        title: "Input is empty",
        description: "Please enter text or upload a file to generate citations for.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const generationResult = await citationGenerator({
          text: inputText,
          fileUrl: fileDataUri || undefined,
          style: citationStyle
        });
        if (generationResult && generationResult.citations.length > 0) {
          setResult(generationResult);
        } else {
          throw new Error("The AI did not generate any citations.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate citations. ${errorMessage}`);
        toast({
          title: "Generation Error",
          description: "An error occurred while creating citations. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!result || result.citations.length === 0) return;
    const allCitations = result.citations.join('\n\n');
    navigator.clipboard.writeText(allCitations);
    toast({
      title: "Copied to clipboard!",
      description: `All citations have been copied.`,
    });
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
     try {
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

      const drawTextWithWrapping = (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; isBold?: boolean; }) => {
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

      for (const citation of result.citations) {
        drawTextWithWrapping(citation, { font: helveticaFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2 * margin });
        y -= 10;
      }
      
      const pages = pdfDoc.getPages();
      const watermarkText = "Researched and created with Vesper";
      for (const pdfPage of pages) {
        const { width, height } = pdfPage.getSize();
        pdfPage.drawText(watermarkText, {
            x: width / 2 - helveticaFont.widthOfTextAtSize(watermarkText, 50) / 2,
            y: height / 2,
            font: helveticaFont,
            size: 50,
            color: rgb(0.1, 0.1, 0.1),
            opacity: 0.1,
            rotate: degrees(-30),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `vesper-citations-${citationStyle}.pdf`;
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
                id="citation-input"
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setFileDataUri(null); setFileName(null); }}
                placeholder="e.g., The history of artificial intelligence, or paste a paragraph here..."
                className="h-60 resize-y bg-background focus-visible:ring-accent"
                disabled={isPending || !!fileDataUri}
            />
        </div>
        <div className="flex flex-col gap-4">
          <Label className="font-semibold text-md">Generated Citations</Label>
          <Card className="min-h-96 bg-background/50 flex flex-col">
            <CardContent className="flex-grow flex items-center justify-center p-6">
              {isPending && (
                <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-semibold">Generating citations...</p>
                </div>
              )}
              {!isPending && !result && (
                <div className="text-center text-muted-foreground p-4">
                  <p>Your generated citations will appear here.</p>
                </div>
              )}
              {!isPending && result && (
                <ScrollArea className="h-[24rem] w-full">
                  <div className="relative w-full flex flex-col gap-4 animate-in fade-in duration-500 pr-4">
                    <div className="absolute top-0 right-4 flex gap-2">
                        <Button
                            onClick={handleCopy}
                            variant="outline"
                            size="sm"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                         <Button
                            onClick={handleDownloadPdf}
                            variant="outline"
                            size="sm"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-4 list-none font-mono mt-12">
                      {result.citations.map((citation, index) => (
                        <li key={index} className="pl-4 border-l-2 border-primary/50">
                            {citation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <div className="w-full max-w-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full flex-grow flex items-center gap-2">
                <Label htmlFor="style-select-citation" className="text-sm font-medium whitespace-nowrap">
                    Style:
                </Label>
                <Select
                    onValueChange={(value: CitationStyle) => setCitationStyle(value)}
                    defaultValue={citationStyle}
                    disabled={isPending}
                >
                    <SelectTrigger id="style-select-citation" className="w-full bg-background">
                        <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="APA">APA</SelectItem>
                        <SelectItem value="MLA">MLA</SelectItem>
                        <SelectItem value="Chicago">Chicago</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button
                onClick={handleGenerate}
                disabled={(!inputText.trim() && !fileDataUri) || isPending}
                size="lg"
                className={cn(
                  "w-full sm:w-auto text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95",
                  isPending && "animate-sparkle"
                )}
            >
                {isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                )}
                <span>{isPending ? "Generating..." : "Generate"}</span>
            </Button>
        </div>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
