
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { GraduationCap, Loader2, Sparkles, Copy, FileText, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { researchAssistant, ResearchAssistantOutput } from "@/ai/flows/research-assistant-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

export function ResearchTab() {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<ResearchAssistantOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleResearch = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to research.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const researchResult = await researchAssistant({ text: inputText });
        if (researchResult) {
          setResult(researchResult);
        } else {
          throw new Error("The research assistant returned no result.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to perform research. ${errorMessage}`);
        toast({
          title: "Research Error",
          description: "An error occurred while researching the text. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleCopy = (textToCopy: string, title: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard!",
      description: `${title} have been copied.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="research-input" className="font-semibold text-md">
            Enter Text for Fact-Checking
          </Label>
          <Textarea
            id="research-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type text here. The AI will analyze the claims and provide citations..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Research Report
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardContent className="flex-grow flex items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">Researching your text...</p>
                            <p className="text-sm text-center">This may take a moment.</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                             <p>Your research report and citations will appear here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <ScrollArea className="h-[24rem] w-full">
                            <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500 pr-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="h-5 w-5"/> Fact-Check Report</h3>
                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(result.report, 'Report')}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap font-mono">
                                        {result.report}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-semibold flex items-center gap-2"><BookCheck className="h-5 w-5"/> Generated Citations (APA)</h3>
                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(result.citations.join('\n\n'), 'Citations')}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <ul className="text-sm text-muted-foreground bg-muted p-4 rounded-md space-y-2 list-none font-mono">
                                        {result.citations.length > 0 ? (
                                            result.citations.map((citation, index) => (
                                            <li key={index}>{citation}</li>
                                            ))
                                        ) : (
                                            <li>No citations could be generated for the provided text.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleResearch}
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
          <span>{isPending ? "Researching..." : "Start Research"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
