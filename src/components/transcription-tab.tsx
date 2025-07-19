
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Upload, Loader2, Sparkles, Download, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { generateTranscription } from "@/ai/flows/transcription-flow";
import { Badge } from "./ui/badge";

export function TranscriptionTab() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [vttContent, setVttContent] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a valid video file.",
      });
      return;
    }
    
    // Reset state for new upload
    setVttContent(null);
    setDetectedLanguage(null);
    setVideoUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoDataUri(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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
    if (!videoDataUri) {
      toast({
        variant: "destructive",
        title: "No video selected",
        description: "Please upload a video file first.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await generateTranscription({
          videoDataUri,
          targetLanguage: targetLanguage.trim() || undefined,
        });
        if (result.vtt) {
          setVttContent(result.vtt);
          setDetectedLanguage(result.detectedLanguage);
          toast({
            title: "Transcription generated!",
            description: `Language: ${result.detectedLanguage}${targetLanguage ? ` | Translated to: ${targetLanguage}` : ''}`,
          });
        } else {
          throw new Error("The model returned empty transcription.");
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "Could not generate transcription for this video.",
        });
      }
    });
  };

  const handleDownload = () => {
    if (!vttContent) return;
    const blob = new Blob([vttContent], { type: "text/vtt;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcription.vtt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label htmlFor="video-upload" className="font-semibold text-md">
          Upload Video
        </Label>
        <div className="relative">
             <input
                type="file"
                id="video-upload"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="sr-only"
                accept="video/*"
             />
             <label
                htmlFor="video-upload"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                className={cn(
                    "group relative flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 overflow-hidden",
                    isDragging
                        ? "border-primary bg-primary/20"
                        : "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
                )}
             >
            {videoUrl ? (
                <video 
                    ref={videoRef} 
                    key={videoUrl} 
                    controls 
                    className="w-full h-full object-contain rounded-lg"
                >
                    <source src={videoUrl} />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop a video
                </p>
                <p className="text-xs text-muted-foreground">MP4, WebM, etc.</p>
                </div>
            )}
            </label>
        </div>
      </div>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
            <Label htmlFor="transcription-output" className="font-semibold text-md">
                Generated Transcription (.vtt)
            </Label>
            {detectedLanguage && <Badge variant="secondary">Detected: {detectedLanguage}</Badge>}
        </div>
        <div className="relative flex-grow min-h-[24rem]">
          {isPending ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background/50 rounded-lg">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-semibold">Generating transcription...</p>
              <p className="text-sm text-center">This may take a moment for longer videos.</p>
            </div>
          ) : (
            <Textarea
              id="transcription-output"
              readOnly
              value={vttContent ?? "Your transcription will appear here..."}
              className="h-full resize-y pr-12 bg-background/30 font-mono text-xs"
            />
          )}
          {!isPending && vttContent && (
            <div className="absolute top-2 right-2 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleDownload}
                aria-label="Download .vtt file"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 py-4">
         <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg">
            <div className="flex-grow w-full">
                <Label htmlFor="target-language" className="sr-only">Translate to (optional)</Label>
                <Input
                    id="target-language"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    placeholder="Translate to... (e.g., Spanish)"
                    className="bg-background/50 focus-visible:ring-accent"
                    disabled={isPending}
                />
            </div>
            <Button
                onClick={handleGenerate}
                disabled={!videoDataUri || isPending}
                size="lg"
                className="w-full sm:w-auto text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                {isPending ? "Generating..." : "Generate Transcription"}
            </Button>
         </div>
      </div>
    </div>
  );
}

    