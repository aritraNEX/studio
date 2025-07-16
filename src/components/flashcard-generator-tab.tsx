
"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { flashcardGenerator, FlashcardGeneratorOutput } from "@/ai/flows/flashcard-generator-flow";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AnimationStyle = 'flip-h' | 'flip-v' | 'fade' | 'slide-up' | 'zoom';

const animationStyles: { name: string; id: AnimationStyle }[] = [
    { name: "Flip Horizontal", id: "flip-h" },
    { name: "Flip Vertical", id: "flip-v" },
    { name: "Fade", id: "fade" },
    { name: "Slide Up", id: "slide-up" },
    { name: "Zoom", id: "zoom" },
];

export function FlashcardGeneratorTab() {
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<FlashcardGeneratorOutput | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('flip-h');

  const handleGenerate = () => {
    if (!inputText.trim()) {
      toast({
        title: "Text is empty",
        description: "Please enter some text to generate flashcards from.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    startTransition(async () => {
      try {
        const generationResult = await flashcardGenerator({ text: inputText });
        if (generationResult && generationResult.flashcards.length > 0) {
          setResult(generationResult);
        } else {
          throw new Error("The AI did not generate any flashcards.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to generate flashcards. ${errorMessage}`);
        toast({
          title: "Generation Error",
          description: "An error occurred while creating flashcards. Please try again.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleNextCard = () => {
    if (result) {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => (prev + 1) % result.flashcards.length);
    }
  };

  const handlePrevCard = () => {
     if (result) {
        setIsFlipped(false);
        setCurrentCardIndex((prev) => (prev - 1 + result.flashcards.length) % result.flashcards.length);
    }
  };
  
  const currentCard = result?.flashcards[currentCardIndex];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="flashcard-input" className="font-semibold text-md">
            Enter Source Text
          </Label>
          <Textarea
            id="flashcard-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your notes, an article, or any text here..."
            className="h-96 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                Generated Flashcards
            </Label>
            <div className="flex flex-col items-center justify-center gap-4">
                <Card 
                    onClick={() => setIsFlipped(f => !f)}
                    className={cn(
                        "w-full h-96 bg-background/50 flex flex-col items-center justify-center text-center cursor-pointer relative group overflow-hidden",
                        {'[perspective:1000px]': animationStyle === 'flip-h' || animationStyle === 'flip-v'}
                    )}
                >
                    <div
                        className={cn(
                            "w-full h-full flex items-center justify-center transition-transform duration-700",
                            { '[transform-style:preserve-3d]': animationStyle === 'flip-h' || animationStyle === 'flip-v'},
                            { 'transform -rotate-y-180': isFlipped && animationStyle === 'flip-h' },
                            { 'transform -rotate-x-180': isFlipped && animationStyle === 'flip-v' }
                        )}
                    >
                        {isPending && (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="font-semibold">Generating your flashcards...</p>
                            </div>
                        )}
                        {!isPending && !currentCard && (
                             <div className="text-center text-muted-foreground p-4">
                                 <p>Your flashcards will appear here. Click a card to flip it.</p>
                            </div>
                        )}
                        {currentCard && (
                            <>
                                {/* Front of the card */}
                                <CardContent className={cn(
                                    "absolute w-full h-full flex items-center justify-center p-6 text-xl font-semibold transition-all duration-700",
                                    { 'backface-hidden': animationStyle === 'flip-h' || animationStyle === 'flip-v' },
                                    { 'opacity-0': isFlipped && animationStyle === 'fade' },
                                    { 'scale-50 opacity-0': isFlipped && animationStyle === 'zoom' },
                                    
                                )}>
                                    {currentCard.front}
                                </CardContent>
                                {/* Back of the card */}
                                <CardContent className={cn(
                                    "absolute w-full h-full flex items-center justify-center p-6 text-lg transition-all duration-700",
                                    { 'backface-hidden transform rotate-y-180': animationStyle === 'flip-h' },
                                    { 'backface-hidden transform rotate-x-180': animationStyle === 'flip-v' },
                                    { 'opacity-0': !isFlipped && animationStyle === 'fade' },
                                    { 'scale-50 opacity-0': !isFlipped && animationStyle === 'zoom' },
                                    { 'translate-y-full': !isFlipped && animationStyle === 'slide-up' },
                                    { 'translate-y-0': isFlipped && animationStyle === 'slide-up' },
                                )}>
                                    {currentCard.back}
                                </CardContent>
                            </>
                        )}
                    </div>
                </Card>
                {result && result.flashcards.length > 0 && (
                    <>
                        <div className="flex items-center justify-between w-full">
                            <Button variant="outline" size="icon" onClick={handlePrevCard} aria-label="Previous card">
                            <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="text-sm font-medium text-muted-foreground">
                                Card {currentCardIndex + 1} of {result.flashcards.length}
                            </div>
                            <Button variant="outline" size="icon" onClick={handleNextCard} aria-label="Next card">
                            <ArrowRight className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                           {animationStyles.map(style => (
                               <Button 
                                   key={style.id}
                                   variant={animationStyle === style.id ? 'default' : 'outline'}
                                   size="sm"
                                   onClick={() => setAnimationStyle(style.id)}
                               >
                                   {style.name}
                               </Button>
                           ))}
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <Button
          onClick={handleGenerate}
          disabled={!inputText.trim() || isPending}
          size="lg"
          className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {isPending ? "Generating..." : "Create Flashcards"}
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
