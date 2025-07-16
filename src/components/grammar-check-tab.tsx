
"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2, Sparkles, SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText, ProcessImageTextOutput } from "@/ai/flows/paraphrase-image-text";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { DiffMatchPatch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch';

export function GrammarCheckTab() {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<ProcessImageTextOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGrammarCheck = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to check.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const checkResult = await processImageText({ text: inputText, operation: 'grammar' });
        if (checkResult && checkResult.processedText) {
          setResult(checkResult);
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
    const dmp = new DiffMatchPatch();
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
          <Label htmlFor="grammar-input" className="font-semibold text-md">
            Enter Your Text
          </Label>
          <Textarea
            id="grammar-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text here to check for grammar, spelling, and punctuation errors..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
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
          disabled={!inputText.trim() || isPending}
          size="lg"
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 sm:w-auto"
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
