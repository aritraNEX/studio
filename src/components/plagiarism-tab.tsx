
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { plagiarismCheck, PlagiarismCheckOutput } from "@/ai/flows/plagiarism-check-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function PlagiarismTab() {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<PlagiarismCheckOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCheckPlagiarism = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to check for plagiarism.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const checkResult = await plagiarismCheck({ text: inputText });
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
          <Label htmlFor="plagiarism-input" className="font-semibold text-md">
            Enter Text to Check
          </Label>
          <Textarea
            id="plagiarism-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type your text here to check for originality..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
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
          <span>{isPending ? "Checking..." : "Check for Plagiarism"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
