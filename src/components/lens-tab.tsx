
"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Loader2, Sparkles, Upload, Send, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { generalChatFlow } from "@/ai/flows/general-chat-flow";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function LensTab() {
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload an image file.' });
      return;
    }
    
    setResult(null);
    setError(null);
    setQuery("");
    
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
  
  const handleAsk = () => {
    if (!fileDataUri) {
      toast({ variant: 'destructive', title: 'No Image', description: 'Please upload an image first.' });
      return;
    }
    if (!query.trim()) {
      toast({ variant: 'destructive', title: 'No Query', description: 'Please enter a question about the image.' });
      return;
    }
    
    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const response = await generalChatFlow({ query, fileUrl: fileDataUri });
        setResult(response.answer);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to analyze image. ${errorMessage}`);
        toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
      }
    });
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast({ title: "Copied to clipboard!" });
  };
  
  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label className="font-semibold text-md">
          Upload an Image
        </Label>
        <label
            htmlFor="lens-upload"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            className={cn(
                "group relative flex flex-col items-center justify-center w-full min-h-[24rem] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 overflow-hidden",
                isDragging ? "border-primary bg-primary/20" : "border-border hover:border-primary"
            )}
        >
          <input
            type="file"
            id="lens-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
            accept="image/*"
            disabled={isPending}
          />
          {fileDataUri ? (
             <Image src={fileDataUri} alt={fileName || "Uploaded image"} fill className="object-contain rounded-lg p-2" />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                <Upload className="w-10 h-10 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                <p className="mb-2 text-sm">
                    <span className="font-semibold text-primary">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs">an image to analyze</p>
            </div>
          )}
        </label>
         <div className="flex w-full items-center space-x-2">
            <Input
                id="lens-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask something about the image..."
                className="bg-background focus-visible:ring-accent text-base h-12"
                disabled={!fileDataUri || isPending}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            />
            <Button
                onClick={handleAsk}
                disabled={!fileDataUri || !query.trim() || isPending}
                size="lg"
                className="h-12"
            >
                {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Send className="h-5 w-5" />
                )}
            </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
             <Label className="font-semibold text-md">AI Response</Label>
             {result && (
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
             )}
        </div>
        <Card className="min-h-[28rem] bg-background/50 flex flex-col">
            <CardContent className="flex-grow flex items-center justify-center p-6 w-full">
                 {isPending && (
                    <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="font-semibold">Analyzing...</p>
                    </div>
                 )}
                 {!isPending && !result && (
                    <div className="text-center text-muted-foreground p-4">
                        <p>Upload an image and ask a question to see the AI's response here.</p>
                    </div>
                 )}
                 {!isPending && result && (
                    <ScrollArea className="h-full w-full">
                        <div className="text-base text-foreground whitespace-pre-wrap font-serif leading-relaxed animate-in fade-in duration-500">
                            {result}
                        </div>
                    </ScrollArea>
                 )}
            </CardContent>
        </Card>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
