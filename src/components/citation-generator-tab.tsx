
"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, Copy, BookA } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { citationGenerator, CitationGeneratorOutput } from "@/ai/flows/citation-generator-flow";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "./ui/scroll-area";

type CitationStyle = 'APA' | 'MLA' | 'Chicago';

export function CitationGeneratorTab() {
  const [inputText, setInputText] = useState<string>("");
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("APA");
  const [result, setResult] = useState<CitationGeneratorOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerate = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter text or a topic to generate citations for.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const generationResult = await citationGenerator({ text: inputText, style: citationStyle });
        if (generationResult && generationResult.citations.length > 0) {
          setResult(generationResult);
        } else {
          throw new Error("The AI did not generate any citations.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate citations. ${errorMessage}`);
        toast({
          title: "Generation Error",
          description: "An error occurred while creating citations. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!result || result.citations.length === 0) return;
    const allCitations = result.citations.join('\n\n');
    navigator.clipboard.writeText(allCitations);
    toast({
      title: "Copied to clipboard!",
      description: `All citations have been copied.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="citation-input" className="font-semibold text-md">
            Enter Text or Topic
          </Label>
          <Textarea
            id="citation-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g., The history of artificial intelligence, or paste a paragraph here..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
          <Label className="font-semibold text-md">Generated Citations</Label>
          <Card className="min-h-96 bg-background/50 flex flex-col">
            <CardContent className="flex-grow flex items-center justify-center p-6">
              {isPending && (
                <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="font-semibold">Generating citations...</p>
                </div>
              )}
              {!isPending && !result && (
                <div className="text-center text-muted-foreground p-4">
                  <p>Your generated citations will appear here.</p>
                </div>
              )}
              {!isPending && result && (
                <ScrollArea className="h-[24rem] w-full">
                  <div className="relative w-full flex flex-col gap-4 animate-in fade-in duration-500 pr-4">
                    <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="absolute top-0 right-4"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy All
                    </Button>
                    <ul className="text-sm text-muted-foreground space-y-4 list-none font-mono">
                      {result.citations.map((citation, index) => (
                        <li key={index} className="pl-4 border-l-2 border-primary/50">
                            {citation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <div className="w-full max-w-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full flex-grow flex items-center gap-2">
                <Label htmlFor="style-select-citation" className="text-sm font-medium whitespace-nowrap">
                    Style:
                </Label>
                <Select
                    onValueChange={(value: CitationStyle) => setCitationStyle(value)}
                    defaultValue={citationStyle}
                    disabled={isPending}
                >
                    <SelectTrigger id="style-select-citation" className="w-full bg-background">
                        <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="APA">APA</SelectItem>
                        <SelectItem value="MLA">MLA</SelectItem>
                        <SelectItem value="Chicago">Chicago</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button
                onClick={handleGenerate}
                disabled={!inputText.trim() || isPending}
                size="lg"
                className="w-full sm:w-auto text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
                {isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                )}
                {isPending ? "Generating..." : "Generate"}
            </Button>
        </div>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
