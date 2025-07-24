
"use client";

import { useState, useTransition } from "react";
import { Gauge, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { toneDetection, ToneDetectionOutput } from "@/ai/flows/tone-detection-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const toneColors: Record<string, string> = {
    "formal": "bg-blue-500",
    "informal": "bg-yellow-500",
    "confident": "bg-green-500",
    "anxious": "bg-purple-500",
    "friendly": "bg-pink-500",
    "joyful": "bg-orange-500",
    "sad": "bg-gray-500",
    "angry": "bg-red-500",
    "urgent": "bg-red-600",
    "analytical": "bg-indigo-500",
    "optimistic": "bg-lime-500",
};

const getToneColor = (tone: string) => {
    return toneColors[tone.toLowerCase()] || "bg-primary";
};

export function ToneDetectionTab() {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<ToneDetectionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDetectTone = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to detect its tone.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const detectionResult = await toneDetection({ text: inputText });
        if (detectionResult && detectionResult.tones.length > 0) {
          setResult(detectionResult);
        } else {
          throw new Error("The AI did not detect any tones.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to detect tone. ${errorMessage}`);
        toast({
          title: "Tone Detection Error",
          description: "An error occurred while analyzing the text. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="tone-input" className="font-semibold text-md">
            Enter Text for Tone Analysis
          </Label>
          <Textarea
            id="tone-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type your text here... The AI will analyze its emotional and stylistic tone."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Tone Analysis Report
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">Detected Tones</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Analyzing your text...</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                            <p>The detected tones and their confidence scores will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
                            <TooltipProvider>
                                {result.tones.map((tone, index) => (
                                     <Tooltip key={index}>
                                        <TooltipTrigger asChild>
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <Label htmlFor={`tone-score-${index}`} className="text-base font-medium">
                                                        {tone.tone}
                                                    </Label>
                                                    <span className={cn(
                                                        "font-bold text-lg",
                                                        "text-foreground"
                                                    )}>
                                                        {tone.score}%
                                                    </span>
                                                </div>
                                                <Progress id={`tone-score-${index}`} value={tone.score} className="h-3" indicatorClassName={getToneColor(tone.tone)} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{tone.explanation}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleDetectTone}
          disabled={!inputText.trim() || isPending}
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
          <span>{isPending ? "Analyzing..." : "Detect Tone"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
