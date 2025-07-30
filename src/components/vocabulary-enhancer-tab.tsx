
"use client";

import { useState, useTransition, useRef } from "react";
import React from "react";
import { BookUp, Loader2, Sparkles, Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { vocabularyEnhancer, VocabularyEnhancerOutput } from "@/ai/flows/vocabulary-enhancer-flow";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export function VocabularyEnhancerTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<VocabularyEnhancerOutput | null>(null);
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


  const handleEnhanceVocabulary = () => {
    if (!inputText.trim() && !fileDataUri) {
      toast({
        title: "Input is empty",
        description: "Please enter some text or upload a file to enhance.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const enhancementResult = await vocabularyEnhancer({
          text: inputText,
          fileUrl: fileDataUri || undefined,
        });
        setResult(enhancementResult);
        if (enhancementResult.suggestions.length === 0) {
            toast({
                title: "No Suggestions",
                description: "Your text is already well-written! The AI found no specific words to enhance."
            });
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to enhance vocabulary. ${errorMessage}`);
        toast({
          title: "Enhancement Error",
          description: "An error occurred while analyzing the text. Please try again.",
          variant: "destructive",
        });
      }
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

        const enhancedParts = getEnhancedTextParts();
        const textFlow = [];
        for (const part of enhancedParts) {
            if (typeof part === 'string') {
                textFlow.push({ text: part, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
            } else {
                 textFlow.push({ text: (part.props.children as any).props.children, font: helveticaBoldFont, color: rgb(0.2, 0.2, 0.8) });
            }
        }
        
        const fontSize = 11;
        const lineHeight = 15;
        let currentX = margin;
        
        for (const item of textFlow) {
            const words = item.text.split(' ');
            for (const word of words) {
                const wordWithSpace = word + ' ';
                const textWidth = item.font.widthOfTextAtSize(wordWithSpace, fontSize);
                if (currentX + textWidth > width - margin) {
                    currentX = margin;
                    y -= lineHeight;
                    if (y < margin) {
                        page = pdfDoc.addPage();
                        y = height - margin;
                    }
                }
                page.drawText(wordWithSpace, {
                    x: currentX,
                    y: y,
                    font: item.font,
                    size: fontSize,
                    color: item.color
                });
                currentX += textWidth;
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
        link.download = "vesper-vocabulary-enhancement.pdf";
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

  const getEnhancedTextParts = () => {
    if (!result?.enhancedText) return [];
    
    let lastIndex = 0;
    const parts = [];

    result.suggestions.forEach((suggestion, i) => {
      if (suggestion.startIndex > lastIndex) {
        parts.push(result.enhancedText.substring(lastIndex, suggestion.startIndex));
      }
      parts.push(
        <Popover key={`popover-${i}`}>
          <PopoverTrigger asChild>
            <span className="bg-primary/20 text-primary font-medium rounded-md px-1 cursor-pointer hover:bg-primary/30 transition-colors">
              {suggestion.originalWord}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-xs">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Suggestions</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                    {suggestion.suggestions.map((item, j) => (
                        <li key={j}>
                            <span className="font-semibold text-foreground">{item.word}</span>: <span className="italic">{item.reason}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </PopoverContent>
        </Popover>
      );
      lastIndex = suggestion.endIndex;
    });

    if (lastIndex < result.enhancedText.length) {
      parts.push(result.enhancedText.substring(lastIndex));
    }
    return parts;
  };

  const renderEnhancedText = () => {
    const parts = getEnhancedTextParts();
    return <p className="text-base text-foreground whitespace-pre-wrap font-serif leading-relaxed">{parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}</p>;
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
                id="vocab-input"
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setFileDataUri(null); setFileName(null); }}
                placeholder="Paste your text here to get vocabulary suggestions..."
                className="h-60 resize-y bg-background focus-visible:ring-accent"
                disabled={isPending || !!fileDataUri}
            />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-md">Enhanced Text</Label>
             {result && (
                <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            )}
          </div>
          <Card className="min-h-96 bg-background/50 flex flex-col items-center justify-center p-6">
            {isPending && (
              <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-semibold">Finding better words...</p>
              </div>
            )}
            {!isPending && !result && (
              <div className="text-center text-muted-foreground p-4">
                <p>Suggestions will appear here. Hover over highlighted words to see alternatives.</p>
              </div>
            )}
            {!isPending && result && (
              <div className="w-full h-full overflow-y-auto animate-in fade-in duration-500">
                {renderEnhancedText()}
              </div>
            )}
          </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleEnhanceVocabulary}
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
          <span>{isPending ? "Analyzing..." : "Enhance Vocabulary"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
