
"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, SpellCheck, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText, ProcessImageTextOutput } from "@/ai/flows/paraphrase-image-text";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import * as diffmatchpatch from 'diff-match-patch';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const dmp = new diffmatchpatch.diff_match_patch();
const { DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } = diffmatchpatch;

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function GrammarCheckTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessImageTextOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required', description: 'You must be signed in to upload files.' });
      return;
    }
    if (!file) return;

    setFileDataUri(null);
    setLocalPreviewUrl(null);
    setInputText("");
    setResult(null);
    setError(null);
    setFileName(file.name);
    
    try {
        const dataUri = await fileToDataUri(file);
        setFileDataUri(dataUri);

        if (file.type.startsWith("image/")) {
            setLocalPreviewUrl(dataUri);
        }
    } catch (err) {
        console.error("File processing failed", err);
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not process the selected file.' });
        setFileName(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        handleFileUpload(file);
    }
    if(event.target) {
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

  const handleGrammarCheck = () => {
    startTransition(async () => {
        if (!fileDataUri) {
        toast({
            title: "File not uploaded",
            description: "Please upload a file before checking.",
            variant: "destructive",
        });
        return;
        }

        setError(null);
        setResult(null);

        try {
            // First, get the original text from the document.
            const originalTextResult = await processImageText({ fileUrl: fileDataUri, operation: 'style', targetStyle: 'original' });
            if (!originalTextResult || !originalTextResult.processedText) {
            throw new Error("Could not extract original text from the document.");
            }
            setInputText(originalTextResult.processedText);
            
            // Then, get the grammar-corrected version.
            const checkResult = await processImageText({ operation: 'grammar', fileUrl: fileDataUri });
            if (checkResult && checkResult.processedText) {
            setResult(checkResult);
            } else {
            throw new Error("The AI returned an empty result for grammar check.");
            }
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(`Failed to check grammar. ${errorMessage}`);
            toast({
            title: "Grammar Check Error",
            description: "An error occurred while checking the text. Please try again.",
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
      description: `The corrected text has been copied.`,
    });
  };

  const handleDownloadPdf = async (textToDownload: string) => {
    if (!textToDownload) return;
    try {
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const margin = 50;
        let y = height - margin;

        const drawTextWithWrapping = (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; }) => {
            const { font, size, color, lineHeight, x, maxWidth } = options;
            const lines = text.split('\n');
            for (const line of lines) {
                let words = line.split(' ');
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
            }
        };
        
        drawTextWithWrapping(textToDownload, { font: helveticaFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2*margin });

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
        link.download = "vesper-grammar-check.pdf";
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
  
  const renderDiff = () => {
    if (!result || !inputText) return null;
    const diffs = dmp.diff_main(inputText, result.processedText);
    dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([type, text], index) => {
        switch (type) {
            case DIFF_INSERT:
                return <span key={index} className="bg-green-200/50 text-green-800 dark:bg-green-800/30 dark:text-green-300 rounded px-1">{text}</span>;
            case DIFF_DELETE:
                return <span key={index} className="bg-red-200/50 text-red-800 dark:bg-red-800/30 dark:text-red-300 line-through rounded px-1">{text}</span>;
            case DIFF_EQUAL:
            default:
                return <span key={index}>{text}</span>;
        }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="grammar-upload" className="font-semibold text-md">
            Upload File
          </Label>
          <div className="relative">
            <input
                type="file"
                id="grammar-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="sr-only"
                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <label
                htmlFor="grammar-upload"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                className={cn(
                    "group flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                    isDragging
                        ? "border-primary bg-primary/20"
                        : "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
                )}
            >
                {localPreviewUrl ? (
                <div className="relative w-full h-full p-2">
                    <Image
                    src={localPreviewUrl}
                    alt="Uploaded content"
                    fill
                    className="rounded-lg object-contain"
                    />
                </div>
                ) : fileName ? (
                 <div className="flex flex-col items-center justify-center text-center p-4">
                    <FileText className="w-16 h-16 mb-4 text-primary" />
                    <p className="font-semibold text-foreground">{fileName}</p>
                    <p className="text-sm text-muted-foreground mt-2">Ready to be checked</p>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                    <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">Image, PDF, or DOCX files</p>
                </div>
                )}
            </label>
        </div>
        </div>
        <div className="flex flex-col gap-4">
          <Label className="font-semibold text-md">Corrected Text</Label>
          <Card className="min-h-96 bg-background/50 flex flex-col">
            <CardContent className="flex-grow flex items-center justify-center p-6">
              {isPending && (
                <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-semibold">Checking your text...</p>
                </div>
              )}
              {!isPending && !result && (
                <div className="text-center text-muted-foreground p-4">
                  <p>Corrections and suggestions will appear here.</p>
                </div>
              )}
              {!isPending && result && (
                <ScrollArea className="h-[24rem] w-full">
                  <div className="relative w-full animate-in fade-in duration-500 pr-4">
                    <div className="absolute top-0 right-4 z-10 flex gap-2">
                        <Button
                            onClick={() => handleCopy(result.processedText)}
                            variant="outline"
                            size="sm"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                         <Button
                            onClick={() => handleDownloadPdf(result.processedText)}
                            variant="outline"
                            size="sm"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                    <p className="text-base text-foreground whitespace-pre-wrap font-serif leading-relaxed mt-12">
                        {renderDiff()}
                    </p>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleGrammarCheck}
          disabled={!fileName || isPending}
          size="lg"
          className={cn(
            "w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto",
            isPending && "animate-sparkle"
          )}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <SpellCheck className="mr-2 h-5 w-5" />
          )}
          <span>{isPending ? "Checking..." : "Check Grammar"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
