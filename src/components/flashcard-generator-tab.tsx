
"use client";

import { useState, useTransition, useRef } from "react";
import { ArrowLeft, ArrowRight, Loader2, Download, Sparkles, Droplets, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { flashcardGenerator, FlashcardGeneratorOutput } from "@/ai/flows/flashcard-generator-flow";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";


type AnimationStyle = 'flip-h' | 'flip-v' | 'fade' | 'slide-up' | 'zoom';

const animationStyles: { name: string; id: AnimationStyle }[] = [
    { name: "Flip Horizontal", id: "flip-h" },
    { name: "Flip Vertical", id: "flip-v" },
    { name: "Fade", id: "fade" },
    { name: "Slide Up", id: "slide-up" },
    { name: "Zoom", id: "zoom" },
];

const colorThemes = [
    { name: 'Default', id: 'default', bgFrontClass: 'bg-card', bgBackClass: 'bg-muted', textClass: 'text-card-foreground', pdf: { bg: [0.98, 0.98, 0.98], text: [0.06, 0.09, 0.13] } },
    { name: 'Slate', id: 'slate', bgFrontClass: 'bg-slate-800', bgBackClass: 'bg-slate-700', textClass: 'text-slate-100', pdf: { bg: [0.11, 0.15, 0.21], text: [0.95, 0.96, 0.97] } },
    { name: 'Sky', id: 'sky', bgFrontClass: 'bg-sky-500', bgBackClass: 'bg-sky-400', textClass: 'text-white', pdf: { bg: [0.05, 0.65, 0.91], text: [1, 1, 1] } },
    { name: 'Amber', id: 'amber', bgFrontClass: 'bg-amber-400', bgBackClass: 'bg-amber-300', textClass: 'text-amber-900', pdf: { bg: [0.98, 0.75, 0.14], text: [0.47, 0.21, 0.06] } },
    { name: 'Emerald', id: 'emerald', bgFrontClass: 'bg-emerald-500', bgBackClass: 'bg-emerald-400', textClass: 'text-white', pdf: { bg: [0.06, 0.73, 0.51], text: [1, 1, 1] } },
    { name: 'Rose', id: 'rose', bgFrontClass: 'bg-rose-600', bgBackClass: 'bg-rose-500', textClass: 'text-white', pdf: { bg: [0.88, 0.11, 0.28], text: [1, 1, 1] } },
];

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export function FlashcardGeneratorTab() {
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<FlashcardGeneratorOutput | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('flip-h');
  const [colorTheme, setColorTheme] = useState(colorThemes[0]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setInputText("");
    setFileDataUri(null);
    setFileName(null);
    const dataUri = await fileToDataUri(file);
    setFileDataUri(dataUri);
    setFileName(file.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleGenerate = () => {
    if (!inputText.trim() && !fileDataUri) {
      toast({
        title: "Input is empty",
        description: "Please enter some text or upload a file to generate flashcards from.",
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
        const generationResult = await flashcardGenerator({
          text: inputText,
          fileUrl: fileDataUri || undefined
        });
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
  
  const handleDownloadPdf = async () => {
    if (!result) return;
    try {
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const cardWidth = width / 2 - 30;
        const cardHeight = height / 4 - 30;
        let x = 20;
        let y = height - 20 - cardHeight;
        let cardCount = 0;
        
        const drawCardText = (text: string, xPos: number, yPos: number, cardW: number, cardH: number) => {
            const lines = text.split('\n');
            const fontSize = 10;
            const lineHeight = 12;
            let currentY = yPos + cardH / 2 + (lines.length / 2) * (lineHeight / 2); // Simple vertical centering
            
            for (const line of lines) {
                const textWidth = helveticaFont.widthOfTextAtSize(line, fontSize);
                const textX = xPos + (cardW - textWidth) / 2; // Horizontal centering
                page.drawText(line, {
                    x: textX,
                    y: currentY,
                    font: helveticaFont,
                    size: fontSize,
                    color: rgb(colorTheme.pdf.text[0], colorTheme.pdf.text[1], colorTheme.pdf.text[2]),
                });
                currentY -= lineHeight;
            }
        };

        for (const card of result.flashcards) {
            // Check if we need a new page
            if (cardCount > 0 && cardCount % 8 === 0) {
                page = pdfDoc.addPage();
                x = 20;
                y = height - 20 - cardHeight;
            }

            // Draw front card
            page.drawRectangle({ x, y, width: cardWidth, height: cardHeight, color: rgb(colorTheme.pdf.bg[0], colorTheme.pdf.bg[1], colorTheme.pdf.bg[2]), borderWidth: 0.5, borderColor: rgb(0.8, 0.8, 0.8) });
            drawCardText(card.front, x, y, cardWidth, cardHeight);
            cardCount++;
            x += cardWidth + 20;

            // Draw back card
            page.drawRectangle({ x, y, width: cardWidth, height: cardHeight, color: rgb(colorTheme.pdf.bg[0] * 0.9, colorTheme.pdf.bg[1] * 0.9, colorTheme.pdf.bg[2] * 0.9), borderWidth: 0.5, borderColor: rgb(0.8, 0.8, 0.8) });
            drawCardText(card.back, x, y, cardWidth, cardHeight);
            cardCount++;
            x = 20;
            y -= cardHeight + 20;
        }

        const pages = pdfDoc.getPages();
        for (const pdfPage of pages) {
            const { width, height } = pdfPage.getSize();
            pdfPage.drawText('Vesper', {
                x: width / 2,
                y: height / 2,
                font: helveticaFont,
                size: 100,
                color: rgb(0.85, 0.85, 0.95),
                opacity: 0.2,
                rotate: degrees(-45),
                xSkew: degrees(-15),
                ySkew: degrees(-15),
            });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `texio-flashcards-${colorTheme.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

  const currentCard = result?.flashcards[currentCardIndex];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">Input</Label>
            <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                className={cn(
                    "flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-xl transition-all duration-300",
                    isDragging
                        ? "border-primary bg-primary/20"
                        : "border-primary/20 hover:border-primary bg-primary/10",
                    fileName ? "border-solid border-primary/50" : ""
                )}
            >
                <div className="flex flex-col items-center justify-center text-center p-4">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary cursor-pointer" onClick={() => fileInputRef.current?.click()}>Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT files</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="sr-only" accept=".pdf,.docx,.txt" />
                </div>
                {fileName && (
                    <div className="flex items-center gap-2 text-sm font-medium bg-muted p-2 rounded-md">
                        <FileText className="h-4 w-4" />
                        <span className="truncate">{fileName}</span>
                    </div>
                )}
            </div>

            <div className="relative flex items-center justify-center my-2">
                <div className="flex-grow border-t border-muted-foreground/20"></div>
                <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
                <div className="flex-grow border-t border-muted-foreground/20"></div>
            </div>

            <Textarea
                id="flashcard-input"
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); setFileDataUri(null); setFileName(null); }}
                placeholder="Paste your notes, an article, or any text here..."
                className="h-60 resize-y bg-background focus-visible:ring-accent"
                disabled={isPending || !!fileDataUri}
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
                disabled={(!inputText.trim() && !fileDataUri) || isPending}
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
            <span>{isPending ? "Generating..." : "Create Flashcards"}</span>
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
