
"use client";

import { useState, useTransition, useRef } from "react";
import { ShieldCheck, Loader2, Sparkles, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { plagiarismCheck, PlagiarismCheckOutput } from "@/ai/flows/plagiarism-check-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
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

export function PlagiarismTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<PlagiarismCheckOutput | null>(null);
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


  const handleCheckPlagiarism = () => {
    if (!inputText.trim() && !fileDataUri) {
      toast({
        title: "Input is empty",
        description: "Please enter some text or upload a file to check for plagiarism.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const checkResult = await plagiarismCheck({
          text: inputText,
          fileUrl: fileDataUri || undefined
        });
        if (checkResult) {
          setResult(checkResult);
        } else {
          throw new Error("The plagiarism check returned no result.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to check plagiarism. ${errorMessage}`);
        toast({
          title: "Plagiarism Check Error",
          description: "An error occurred while checking the text. Please try again.",
          variant: "destructive",
        });
      }
    });
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
                id="plagiarism-input"
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setFileDataUri(null); setFileName(null); }}
                placeholder="Paste or type your text here to check for originality..."
                className="h-60 resize-y bg-background focus-visible:ring-accent"
                disabled={isPending || !!fileDataUri}
            />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Analysis Report
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">Plagiarism Analysis</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Analyzing your text...</p>
                            <p className="text-sm text-center">This may take a moment.</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                            <p>Your plagiarism report will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <Label htmlFor="plagiarism-score" className="text-base font-medium">
                                        Plagiarism Score
                                    </Label>
                                    <span className={cn(
                                        "font-bold text-xl",
                                        {
                                            "text-destructive": result.plagiarismScore > 75,
                                            "text-chart-4": result.plagiarismScore > 40 && result.plagiarismScore <= 75,
                                            "text-chart-2": result.plagiarismScore <= 40,
                                        }
                                    )}>
                                        {result.plagiarismScore}%
                                    </span>
                                </div>
                                <Progress id="plagiarism-score" value={result.plagiarismScore} className="h-3" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h3 className="font-semibold">Report Details:</h3>
                                <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap font-mono">
                                    {result.report}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleCheckPlagiarism}
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
          <span>{isPending ? "Checking..." : "Check for Plagiarism"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
