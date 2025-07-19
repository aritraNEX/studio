
"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { AudioLines, Loader2, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useWorkspace } from "@/contexts/workspace-context";

const voices = ['Algenib', 'Achernar', 'Schedar', 'Umbriel', 'Zephyr'];

export function TtsTab() {
  const { workspaceText, setWorkspaceText } = useWorkspace();
  const [inputText, setInputText] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (workspaceText) {
      setInputText(workspaceText);
      setWorkspaceText(""); // Clear after use
    }
  }, [workspaceText, setWorkspaceText]);

  const handleGenerateSpeech = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to convert to speech.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setAudioUrl(null);

    startTransition(async () => {
      try {
        const result = await textToSpeech({
            text: inputText,
            voice: selectedVoice as any,
        });
        setAudioUrl(result.audioDataUri);
      } catch (e) {
        console.error("Failed to generate speech", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate speech. ${errorMessage}`);
        toast({
          title: "Speech Generation Failed",
          description: "Could not convert text to speech. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="tts-input" className="font-semibold text-md">
            Enter Text to Convert
          </Label>
          <Textarea
            id="tts-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type your text here..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Generated Audio
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">Audio Player</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center p-6 gap-4">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Generating audio...</p>
                        </div>
                    )}
                    {!isPending && !audioUrl && (
                         <div className="text-center text-muted-foreground p-4">
                            <p>Your audio will appear here.</p>
                        </div>
                    )}
                    {!isPending && audioUrl && (
                        <div className="w-full animate-in fade-in duration-500">
                            <audio controls autoPlay className="w-full">
                                <source src={audioUrl} type="audio/wav" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <div className="w-full max-w-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full flex-grow flex items-center gap-2">
                <Label htmlFor="voice-select-tts" className="text-sm font-medium whitespace-nowrap">
                    Voice:
                </Label>
                <Select onValueChange={setSelectedVoice} defaultValue={selectedVoice} disabled={isPending}>
                    <SelectTrigger id="voice-select-tts" className="w-full bg-background">
                    <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                    {voices.map((voice) => (
                        <SelectItem key={voice} value={voice}>
                        {voice}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
              onClick={handleGenerateSpeech}
              disabled={!inputText.trim() || isPending}
              size="lg"
              className="w-full sm:w-auto text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Volume2 className="mr-2 h-5 w-5" />
              )}
              {isPending ? "Generating..." : "Generate"}
            </Button>
        </div>

        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
