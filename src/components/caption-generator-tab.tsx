
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Upload, Loader2, Sparkles, Captions, Download } from "lucide-react";
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

type CaptionStyle = 'minimal' | 'cinematic' | 'highlight' | 'social';

// A more robust VTT parser
const parseVTT = (vttContent: string): VttCue[] => {
    if (!vttContent || !vttContent.startsWith('WEBVTT')) return [];
    
    const cues: VttCue[] = [];
    const lines = vttContent.replace(/\r/g, '').split('\n');
    
    const parseTime = (timeStr: string): number => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(part => parseFloat(part));
        let seconds = 0;
        if (parts.length === 3) {
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
            seconds = parts[0];
        }
        return isNaN(seconds) ? 0 : seconds;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('-->')) {
            const [startTimeStr, endTimeStr] = line.split(' --> ');
            const textLines: string[] = [];
            let j = i + 1;
            while (j < lines.length && lines[j] !== '') {
                textLines.push(lines[j]);
                j++;
            }
            cues.push({
                startTime: parseTime(startTimeStr),
                endTime: parseTime(endTimeStr?.split(' ')[0]),
                text: textLines.join('\n')
            });
            i = j; // Move index past the current cue block
        }
    }
    
    return cues;
};


// Component to render the "Social" style caption with word highlighting
const SocialCaption = ({ text, wordsToHighlight }: { text: string; wordsToHighlight: string[] }) => {
    const highlightWords = new Set(wordsToHighlight.map(w => w.trim().toUpperCase()).filter(Boolean));
    const words = text.split(/(\s+)/); // Split by space, keeping spaces for reconstruction

    return (
        <>
            {words.map((word, index) => {
                const isHighlight = highlightWords.has(word.toUpperCase());
                return (
                    <span
                        key={index}
                        className={cn(
                            isHighlight ? 'text-yellow-400' : 'text-white'
                        )}
                    >
                        {word}
                    </span>
                );
            })}
        </>
    );
};


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
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('social');
  const [highlightWords, setHighlightWords] = useState<string>('');


  useEffect(() => {
    if (vttContent) {
        const cues = parseVTT(vttContent);
        setParsedCues(cues);
    } else {
        setParsedCues([]);
    }
  }, [vttContent]);

  const handleTimeUpdate = () => {
    if (!videoRef.current || parsedCues.length === 0) {
      if (activeCue) setActiveCue(null);
      return;
    }
    
    const currentTime = videoRef.current.currentTime;
    const currentCue = parsedCues.find(cue => currentTime >= cue.startTime && currentTime <= cue.endTime);
    
    if (currentCue?.text !== activeCue?.text) {
       setActiveCue(currentCue || null);
    } else if (!currentCue && activeCue) {
       setActiveCue(null);
    }
  }

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
          description: e instanceof Error ? e.message : "Could not generate captions for this video.",
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
    toast({ title: "Downloaded transcription.vtt" });
  };
  
  const captionStyleClasses: Record<CaptionStyle, string> = {
    minimal: 'bottom-8 text-white bg-black/60 px-4 py-2 text-xl font-sans rounded-lg shadow-lg',
    cinematic: 'bottom-16 text-white text-3xl font-serif tracking-wider text-shadow-md',
    highlight: 'bottom-10 text-black bg-yellow-400 px-3 py-1.5 text-2xl font-bold uppercase font-sans',
    social: 'bottom-24 text-white text-4xl font-extrabold uppercase [text-shadow:0_3px_5px_rgba(0,0,0,0.8)] leading-tight text-center px-4',
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
                            "absolute left-1/2 -translate-x-1/2 rounded-lg pointer-events-none transition-opacity duration-200",
                            activeCue ? 'opacity-100' : 'opacity-0',
                            captionStyleClasses[captionStyle]
                        )}>
                            {captionStyle === 'social' ? (
                                <SocialCaption text={activeCue.text} wordsToHighlight={highlightWords.split(',')} />
                            ) : (
                                <p className="whitespace-pre-wrap">{activeCue.text}</p>
                            )}
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
                <Select onValueChange={(value) => setCaptionStyle(value as CaptionStyle)} defaultValue="social" disabled={isPending || !vttContent}>
                    <SelectTrigger id="caption-style-select" className="bg-background/50 focus-visible:ring-accent">
                        <SelectValue placeholder="Select a caption style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="social">Social</SelectItem>
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
            {vttContent && (
              <Button
                onClick={handleDownload}
                disabled={isPending}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-5 w-5" />
                Download .vtt
              </Button>
            )}
         </div>
         {captionStyle === 'social' && vttContent && (
             <div className="w-full max-w-sm mt-2 animate-in fade-in duration-300">
                <Label htmlFor="highlight-words">Words to Highlight (comma-separated)</Label>
                <Input 
                    id="highlight-words"
                    placeholder="e.g., AI, magic"
                    value={highlightWords}
                    onChange={(e) => setHighlightWords(e.target.value)}
                    className="bg-background/50 focus-visible:ring-accent"
                />
             </div>
         )}
          {detectedLanguage && <Badge variant="secondary" className="mt-2">Detected Language: {detectedLanguage}</Badge>}
      </div>
    </div>
  );
}
