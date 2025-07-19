
"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, SpellCheck, Upload } from "lucide-react";
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
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

const dmp = new diffmatchpatch.diff_match_patch();
const { DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } = diffmatchpatch;

export function GrammarCheckTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<ProcessImageTextOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication required', description: 'You must be signed in to upload files.' });
      return;
    }
    if (!file) return;

    setFileUrl(null);
    setInputText("");
    setResult(null);
    setError(null);
    
    const fileType = file.type;
    const isImage = fileType.startsWith("image/");
    setIsParsing(!isImage);

     try {
        const storageRef = ref(storage, `uploads/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        setFileUrl(downloadURL); 
        
        if (isImage) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target?.result as ArrayBuffer;
                if (fileType === 'application/pdf') {
                    const pdf = await pdfjsLib.getDocument(buffer).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                    }
                    setInputText(text);
                } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                    setInputText(result.value);
                }
            } catch (err) {
                 toast({ variant: 'destructive', title: 'File Parse Error', description: `Could not read text from ${file.name}.` });
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'File Read Error', description: `Could not read the file: ${file.name}` });
            setIsParsing(false);
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Upload failed", error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload your file to storage.'});
      setIsParsing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        handleFileUpload(file);
    }
     // Reset file input to allow uploading the same file again
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
    const hasFile = !!fileUrl;
    const hasText = !!inputText.trim();

    if (!hasFile && !hasText) {
      toast({
        title: "No Content",
        description: "Please upload a file or enter some text to check.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const payload = {
            operation: 'grammar' as const,
            ...(hasFile && !hasText ? { fileUrl } : { text: inputText })
        };
        const checkResult = await processImageText(payload);

        if (checkResult && checkResult.processedText) {
          setResult(checkResult);
          // If input text was empty (file-only), populate it with corrected text for diff
          if (!inputText && checkResult.processedText) {
              const originalTextResult = await processImageText({ fileUrl, operation: 'style', targetStyle: 'original' });
              setInputText(originalTextResult.processedText);
          }
        } else {
          throw new Error("The AI returned an empty result.");
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
  
  const renderDiff = () => {
    if (!result) return null;
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
            Upload File or Enter Text
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
                    "group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                    isDragging
                        ? "border-primary bg-primary/20"
                        : "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
                )}
            >
                {isParsing ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Parsing document...</p>
                </div>
                ) : fileUrl ? (
                <div className="relative w-full h-full p-2">
                    <Image
                    src={fileUrl}
                    alt="Uploaded content"
                    fill
                    className="rounded-lg object-contain"
                    />
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
          <Textarea
            id="grammar-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Or paste your text here to check for grammar, spelling, and punctuation errors..."
            className="h-48 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
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
                    <Button
                        onClick={() => handleCopy(result.processedText)}
                        variant="outline"
                        size="sm"
                        className="absolute top-0 right-4 z-10"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Result
                    </Button>
                    <p className="text-base text-foreground whitespace-pre-wrap font-serif leading-relaxed">
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
          disabled={(!fileUrl && !inputText.trim()) || isPending || isParsing}
          size="lg"
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <SpellCheck className="mr-2 h-5 w-5" />
          )}
          {isPending ? "Checking..." : "Check Grammar"}
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
    
