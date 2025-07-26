
"use client";

import { useState, useTransition } from "react";
import React from "react";
import { BookUp, Loader2, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { vocabularyEnhancer, VocabularyEnhancerOutput } from "@/ai/flows/vocabulary-enhancer-flow";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export function VocabularyEnhancerTab() {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<VocabularyEnhancerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleEnhanceVocabulary = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to enhance.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const enhancementResult = await vocabularyEnhancer({ text: inputText });
        setResult(enhancementResult);
        if (enhancementResult.suggestions.length === 0) {
            toast({
                title: "No Suggestions",
                description: "Your text is already well-written! The AI found no specific words to enhance."
            });
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to enhance vocabulary. ${errorMessage}`);
        toast({
          title: "Enhancement Error",
          description: "An error occurred while analyzing the text. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const margin = 50;
        let y = height - margin;

        await helveticaFont.drawText('Vocabulary Enhanced Text', {
            x: margin,
            y: y,
            font: helveticaBoldFont,
            size: 18,
            color: rgb(0, 0, 0),
        });
        y -= 30;

        const enhancedParts = getEnhancedTextParts();
        const textFlow = [];
        for (const part of enhancedParts) {
            if (typeof part === 'string') {
                textFlow.push({ text: part, font: helveticaFont, color: rgb(0.1, 0.1, 0.1) });
            } else {
                 textFlow.push({ text: (part.props.children as any).props.children, font: helveticaBoldFont, color: rgb(0.2, 0.2, 0.8) });
            }
        }
        
        const fontSize = 11;
        const lineHeight = 15;
        let currentX = margin;
        
        for (const item of textFlow) {
            const words = item.text.split(' ');
            for (const word of words) {
                const wordWithSpace = word + ' ';
                const textWidth = item.font.widthOfTextAtSize(wordWithSpace, fontSize);
                if (currentX + textWidth > width - margin) {
                    currentX = margin;
                    y -= lineHeight;
                    if (y < margin) {
                        page = pdfDoc.addPage();
                        y = height - margin;
                    }
                }
                page.drawText(wordWithSpace, {
                    x: currentX,
                    y: y,
                    font: item.font,
                    size: fontSize,
                    color: item.color
                });
                currentX += textWidth;
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "vesper-vocabulary-enhancement.pdf";
        link.click();
        URL.revokeObjectURL(link.href);

    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "Could not create the PDF file. Please try again."
        });
    }
  };

  const getEnhancedTextParts = () => {
    if (!result) return [<p key="orig">{inputText}</p>];
    
    let lastIndex = 0;
    const parts = [];

    result.suggestions.forEach((suggestion, i) => {
      if (suggestion.startIndex > lastIndex) {
        parts.push(inputText.substring(lastIndex, suggestion.startIndex));
      }
      parts.push(
        <Popover key={`popover-${i}`}>
          <PopoverTrigger asChild>
            <span className="bg-primary/20 text-primary font-medium rounded-md px-1 cursor-pointer hover:bg-primary/30 transition-colors">
              {suggestion.originalWord}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-xs">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Suggestions</h4>
                <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                    {suggestion.suggestions.map((item, j) => (
                        <li key={j}>
                            <span className="font-semibold text-foreground">{item.word}</span>: <span className="italic">{item.reason}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </PopoverContent>
        </Popover>
      );
      lastIndex = suggestion.endIndex;
    });

    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    return parts;
  };

  const renderEnhancedText = () => {
    const parts = getEnhancedTextParts();
    return <p className="text-base text-foreground whitespace-pre-wrap font-serif leading-relaxed">{parts.map((part, index) => <React.Fragment key={index}>{part}</React.Fragment>)}</p>;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="vocab-input" className="font-semibold text-md">
            Enter Your Text
          </Label>
          <Textarea
            id="vocab-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text here to get vocabulary suggestions..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Label className="font-semibold text-md">Enhanced Text</Label>
             {result && (
                <Button onClick={handleDownloadPdf} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            )}
          </div>
          <Card className="min-h-96 bg-background/50 flex flex-col items-center justify-center p-6">
            {isPending && (
              <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-semibold">Finding better words...</p>
              </div>
            )}
            {!isPending && !result && (
              <div className="text-center text-muted-foreground p-4">
                <p>Suggestions will appear here. Hover over highlighted words to see alternatives.</p>
              </div>
            )}
            {!isPending && result && (
              <div className="w-full h-full overflow-y-auto animate-in fade-in duration-500">
                {renderEnhancedText()}
              </div>
            )}
          </Card>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleEnhanceVocabulary}
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
          <span>{isPending ? "Analyzing..." : "Enhance Vocabulary"}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
