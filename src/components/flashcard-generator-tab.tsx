
"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Download, Sparkles, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { flashcardGenerator, FlashcardGeneratorOutput } from "@/ai/flows/flashcard-generator-flow";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

type AnimationStyle = 'flip-h' | 'flip-v' | 'fade' | 'slide-up' | 'zoom';

const animationStyles: { name: string; id: AnimationStyle }[] = [
    { name: "Flip Horizontal", id: "flip-h" },
    { name: "Flip Vertical", id: "flip-v" },
    { name: "Fade", id: "fade" },
    { name: "Slide Up", id: "slide-up" },
    { name: "Zoom", id: "zoom" },
];

const colorThemes = [
    { name: 'Default', id: 'default', bgFrontClass: 'bg-card', bgBackClass: 'bg-muted', textClass: 'text-card-foreground', pdf: { bg: [248, 250, 252], text: [30, 41, 59] } },
    { name: 'Slate', id: 'slate', bgFrontClass: 'bg-slate-800', bgBackClass: 'bg-slate-700', textClass: 'text-slate-100', pdf: { bg: [30, 41, 59], text: [241, 245, 249] } },
    { name: 'Sky', id: 'sky', bgFrontClass: 'bg-sky-500', bgBackClass: 'bg-sky-400', textClass: 'text-white', pdf: { bg: [14, 165, 233], text: [255, 255, 255] } },
    { name: 'Amber', id: 'amber', bgFrontClass: 'bg-amber-400', bgBackClass: 'bg-amber-300', textClass: 'text-amber-900', pdf: { bg: [251, 191, 36], text: [120, 53, 15] } },
    { name: 'Emerald', id: 'emerald', bgFrontClass: 'bg-emerald-500', bgBackClass: 'bg-emerald-400', textClass: 'text-white', pdf: { bg: [16, 185, 129], text: [255, 255, 255] } },
    { name: 'Rose', id: 'rose', bgFrontClass: 'bg-rose-600', bgBackClass: 'bg-rose-500', textClass: 'text-white', pdf: { bg: [225, 29, 72], text: [255, 255, 255] } },
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
  const [colorTheme, setColorTheme] = useState(colorThemes[0]);

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
        setTimeout(() => setCurrentCardIndex((prev) => (prev + 1) % result.flashcards.length), 150);
    }
  };

  const handlePrevCard = () => {
     if (result) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIndex((prev) => (prev - 1 + result.flashcards.length) % result.flashcards.length), 150);
    }
  };
  
  const handleDownloadPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Tex.io Flashcards", 14, 22);

    let yPos = 32;

    result.flashcards.forEach((card, index) => {
      if (yPos > 240) { // Check space for both front and back
        doc.addPage();
        yPos = 22;
      }
      
      const drawCard = (title: string, text: string) => {
        const textLines = doc.splitTextToSize(text, 170);
        const cardHeight = (textLines.length * 7) + 20;

        if (yPos + cardHeight > 280) {
            doc.addPage();
            yPos = 22;
        }

        doc.setFillColor(colorTheme.pdf.bg[0], colorTheme.pdf.bg[1], colorTheme.pdf.bg[2]);
        doc.roundedRect(14, yPos, 182, cardHeight, 3, 3, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(colorTheme.pdf.text[0], colorTheme.pdf.text[1], colorTheme.pdf.text[2]);
        doc.text(title, 20, yPos + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(textLines, 20, yPos + 20);
        
        return cardHeight + 5;
      };

      yPos += drawCard(`Card ${index + 1} - Front`, card.front);
      yPos += drawCard(`Card ${index + 1} - Back`, card.back);
      yPos += 5; // Extra space between card pairs
    });

    doc.save(`texio-flashcards-${colorTheme.id}.pdf`);
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
                        "w-full h-96 flex flex-col items-center justify-center text-center cursor-pointer relative group overflow-hidden transition-colors duration-500",
                        colorTheme.bgFrontClass,
                        {'[perspective:1000px]': animationStyle === 'flip-h' || animationStyle === 'flip-v'}
                    )}
                >
                    <div
                        className={cn(
                            "w-full h-full flex items-center justify-center transition-transform duration-700",
                            colorTheme.textClass,
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
                             <div className={cn("text-center p-4", colorTheme.id === 'default' ? 'text-muted-foreground' : colorTheme.textClass)}>
                                 <p>Your flashcards will appear here. Click a card to flip it.</p>
                            </div>
                        )}
                        {currentCard && (
                            <>
                                {/* Front of the card */}
                                <CardContent className={cn(
                                    "absolute w-full h-full flex items-center justify-center p-6 text-xl font-semibold transition-all duration-700",
                                    colorTheme.bgFrontClass,
                                    { 'backface-hidden': animationStyle === 'flip-h' || animationStyle === 'flip-v' },
                                    { 'opacity-0': isFlipped && animationStyle === 'fade' },
                                    { 'scale-50 opacity-0': isFlipped && animationStyle === 'zoom' },
                                    
                                )}>
                                    {currentCard.front}
                                </CardContent>
                                {/* Back of the card */}
                                <CardContent className={cn(
                                    "absolute w-full h-full flex items-center justify-center p-6 text-lg transition-all duration-700",
                                    colorTheme.bgBackClass,
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
                        <div className="flex flex-col items-center gap-3 mt-2 w-full">
                           <Label className="text-sm font-medium text-muted-foreground">Animation Style</Label>
                           <div className="flex flex-wrap items-center justify-center gap-2">
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
                           <Label className="text-sm font-medium text-muted-foreground mt-2">Color Theme</Label>
                           <div className="flex flex-wrap items-center justify-center gap-2">
                               {colorThemes.map(theme => (
                                   <Button 
                                       key={theme.id}
                                       variant="outline"
                                       size="icon"
                                       title={theme.name}
                                       onClick={() => setColorTheme(theme)}
                                       className={cn("h-8 w-8 rounded-full", { 'ring-2 ring-primary ring-offset-2': colorTheme.id === theme.id })}
                                   >
                                       <div className={cn("h-6 w-6 rounded-full", theme.bgFrontClass)}></div>
                                   </Button>
                               ))}
                           </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4">
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
            {result && result.flashcards.length > 0 && (
                 <Button
                    onClick={handleDownloadPdf}
                    disabled={isPending}
                    size="lg"
                    variant="outline"
                    className="w-full max-w-xs text-lg font-semibold transition-all duration-300 hover:scale-105 sm:w-auto"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>
            )}
        </div>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}


    