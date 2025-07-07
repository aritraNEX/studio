"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, Upload, Quote, BookText, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText } from "@/ai/flows/paraphrase-image-text";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Operation = 'paraphrase' | 'summarize' | 'translate';

const operationDetails: Record<Operation, { icon: React.ElementType; label: string }> = {
  paraphrase: { icon: Quote, label: 'Paraphrase' },
  summarize: { icon: BookText, label: 'Summarize' },
  translate: { icon: Languages, label: 'Translate' },
};


export function TexioApp() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [operation, setOperation] = useState<Operation>('paraphrase');
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setImageDataUrl(result);
        setGeneratedText("");
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
        handleImageUpload(file);
    }
  };

  const handleProcess = () => {
    if (!imageDataUrl) return;
    if (operation === 'translate' && !targetLanguage.trim()) {
        toast({
            title: "Language required",
            description: "Please enter a target language for translation.",
            variant: "destructive",
        });
        return;
    }

    setError(null);
    setGeneratedText("");
    startTransition(async () => {
      try {
        const result = await processImageText({ 
            photoDataUri: imageDataUrl,
            operation,
            ...(operation === 'translate' ? { targetLanguage } : {})
        });
        if (result && result.processedText) {
          setGeneratedText(result.processedText);
        } else {
          throw new Error("The processed text is empty.");
        }
      } catch (e) {
        console.error(e);
        setError(`Failed to ${operation} text. Please try again.`);
        toast({
          title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Error`,
          description: `An error occurred. Please try another image.`,
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied to clipboard!",
      description: "The result has been copied.",
    });
  };

  const handleOperationChange = (op: Operation) => {
    setOperation(op);
    setGeneratedText("");
    setError(null);
  }

  const buttonText = {
      paraphrase: 'Paraphrase',
      summarize: 'Summarize',
      translate: 'Translate'
  }[operation];

  const buttonTextPending = {
      paraphrase: 'Paraphrasing...',
      summarize: 'Summarizing...',
      translate: 'Translating...'
  }[operation];

  return (
    <Card className="w-full max-w-4xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-xl p-3 w-fit mb-4 shadow-lg shadow-primary/30">
          <Sparkles className="h-8 w-8" />
        </div>
        <CardTitle className="text-4xl font-bold tracking-tight">Tex.io</CardTitle>
        <CardDescription className="text-lg text-muted-foreground/80">
          Upload an image to magically paraphrase, summarize, or translate its text.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 items-start p-8">
        <div className="flex flex-col gap-4">
          <Label htmlFor="image-upload" className="font-semibold text-md">
            Upload Image
          </Label>
          <div className="relative">
            <input
              type="file"
              id="image-upload"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="sr-only"
              accept="image/*"
            />
            <label
              htmlFor="image-upload"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "group flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
              )}
            >
              {imageDataUrl ? (
                <div className="relative w-full h-full p-2">
                  <Image
                    src={imageDataUrl}
                    alt="Uploaded text"
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
                  <p className="text-xs text-muted-foreground">Any common image format</p>
                </div>
              )}
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-4 h-full">
          <Label className="font-semibold text-md">Operation</Label>
          <div className="flex w-full items-center gap-1 rounded-full bg-muted p-1">
            {(Object.keys(operationDetails) as Operation[]).map((op) => {
              const { icon: Icon, label } = operationDetails[op];
              return (
              <Button
                key={op}
                variant="ghost"
                className={cn(
                  'w-full rounded-full py-2 text-sm h-auto transition-all',
                  operation === op 
                    ? 'bg-background text-foreground shadow-sm font-semibold' 
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                )}
                onClick={() => handleOperationChange(op)}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Button>
            )})}
          </div>
          
          {operation === 'translate' && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-300">
              <Label htmlFor="language-input" className="font-semibold text-md">
                Translate to
              </Label>
              <Input 
                id="language-input"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                placeholder="e.g., Spanish, French, Japanese"
                className="bg-background/50 focus-visible:ring-accent"
              />
            </div>
          )}

          <Label htmlFor="output-text" className="font-semibold text-md">
            Result
          </Label>
          <div className="relative flex-grow">
            <Textarea
              id="output-text"
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              placeholder={isPending ? "Generating..." : "Your result will appear here..."}
              className="h-full min-h-48 resize-y pr-12 bg-background focus-visible:ring-accent"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={!generatedText || isPending}
              aria-label="Copy to clipboard"
            >
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center gap-4 pt-4 pb-8">
        <div className="w-full max-w-xs p-4 border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground text-sm">
          <p className="font-semibold text-xs mb-2 text-muted-foreground/70 uppercase tracking-wider">Advertisement</p>
          <div className="w-full h-20 bg-muted/50 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground/80">Your Ad Here</p>
          </div>
        </div>
        <Button
          onClick={handleProcess}
          disabled={!imageDataUrl || isPending || (operation === 'translate' && !targetLanguage.trim())}
          size="lg"
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isPending ? buttonTextPending : buttonText}
        </Button>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </CardFooter>
    </Card>
  );
}
