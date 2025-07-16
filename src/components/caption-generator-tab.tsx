
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Upload, Loader2, Sparkles, Download, Captions } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { generateTranscription } from "@/ai/flows/transcription-flow";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "./ui/card";

interface VttCue {
  startTime: number;
  endTime: number;
  text: string;
}

type CaptionStyle = 'minimal' | 'cinematic' | 'highlight';

// A simple VTT parser
const parseVTT = (vttContent: string): VttCue[] => {
    if (!vttContent || !vttContent.startsWith('WEBVTT')) return [];
    
    const lines = vttContent.split('\n');
    const cues: VttCue[] = [];
    
    const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        let hours = 0, minutes = 0, seconds = 0;
        
        if (parts.length === 3) { // HH:MM:SS.ms
            hours = parseInt(parts[0], 10);
            minutes = parseInt(parts[1], 10);
            seconds = parseFloat(parts[2]);
        } else if (parts.length === 2) { // MM:SS.ms
            minutes = parseInt(parts[0], 10);
            seconds = parseFloat(parts[1]);
        } else {
            return 0; // Invalid format
        }

        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;

        return hours * 3600 + minutes * 60 + seconds;
    };

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
            const timeLine = lines[i];
            const textLine = lines[i + 1];

            if (timeLine && textLine) {
                 const [start, end] = timeLine.split(' --> ').map(s => s.trim().split(' ')[0]); // Handle extra metadata like 'align:start'
                 
                 cues.push({
                     startTime: parseTime(start),
                     endTime: parseTime(end),
                     text: textLine,
                 });
                 i++; // Skip the text line as it's processed
            }
        }
    }
    return cues;
}

export function CaptionGeneratorTab() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDataUri, setVideoDataUri] = useState<string | null>(null);
  const [vttContent, setVttContent] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [parsedCues, setParsedCues] = useState<VttCue[]>([]);
  const [activeCue, setActiveCue] = useState<VttCue | null>(null);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('minimal');


  useEffect(() => {
    if (vttContent) {
        setParsedCues(parseVTT(vttContent));
    } else {
        setParsedCues([]);
    }
  }, [vttContent]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || parsedCues.length === 0) return;
    
    const currentTime = videoRef.current.currentTime;
    const currentCue = parsedCues.find(cue => currentTime >= cue.startTime && currentTime <= cue.endTime);
    
    setActiveCue(currentCue || null);
  }

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
    setActiveCue(null);
    setParsedCues([]);
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
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
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
        // We don't need translation for this feature
        const result = await generateTranscription({ videoDataUri });
        if (result.vtt) {
          setVttContent(result.vtt);
          setDetectedLanguage(result.detectedLanguage);
          toast({
            title: "Captions generated!",
            description: `Language: ${result.detectedLanguage}`,
          });
        } else {
          throw new Error("The model returned empty transcription.");
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "Could not generate captions for this video.",
        });
      }
    });
  };
  
  const captionStyleClasses: Record<CaptionStyle, string> = {
    minimal: 'bottom-8 text-white bg-black/60 px-4 py-2 text-xl font-sans rounded-lg shadow-lg',
    cinematic: 'bottom-16 text-white text-3xl font-serif tracking-wider text-shadow-md',
    highlight: 'bottom-10 text-black bg-yellow-400 px-3 py-1.5 text-2xl font-bold uppercase font-sans'
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <Card className="w-full max-w-4xl">
            <CardContent className="p-4">
                 <label
                    htmlFor="video-upload-captions"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "group relative flex flex-col items-center justify-center w-full min-h-[480px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                        "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground overflow-hidden"
                    )}
                 >
                    <input
                        type="file"
                        id="video-upload-captions"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="sr-only"
                        accept="video/*"
                    />
                {videoUrl ? (
                    <>
                    <video 
                        ref={videoRef} 
                        key={videoUrl} 
                        controls 
                        className="w-full h-full object-contain rounded-lg"
                        onTimeUpdate={handleTimeUpdate}
                    >
                        <source src={videoUrl} />
                        Your browser does not support the video tag.
                    </video>
                    {activeCue && (
                        <div className={cn(
                            "absolute left-1/2 -translate-x-1/2 rounded-lg pointer-events-none text-center transition-opacity duration-200",
                            activeCue ? 'opacity-100' : 'opacity-0',
                            captionStyleClasses[captionStyle]
                        )}>
                            {activeCue.text}
                        </div>
                    )}
                    </>
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
            </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
         <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-grow w-full">
                <Label htmlFor="caption-style-select" className="sr-only">Caption Style</Label>
                <Select onValueChange={(value) => setCaptionStyle(value as CaptionStyle)} defaultValue="minimal" disabled={isPending || !vttContent}>
                    <SelectTrigger id="caption-style-select" className="bg-background/50 focus-visible:ring-accent">
                        <SelectValue placeholder="Select a caption style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button
                onClick={handleGenerate}
                disabled={!videoDataUri || isPending}
                size="lg"
                className="w-full sm:w-auto text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                {isPending ? "Generating..." : "Generate Captions"}
            </Button>
         </div>
          {detectedLanguage && <Badge variant="secondary" className="mt-2">Detected Language: {detectedLanguage}</Badge>}
      </div>
    </div>
  );
}
