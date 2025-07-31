
"use client";

import { useState, useTransition } from "react";
import { PenSquare, Loader2, Sparkles, Download, Copy, FileText, BookCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { assignmentMaker, AssignmentMakerOutput } from "@/ai/flows/assignment-maker-flow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { cn } from "@/lib/utils";
import React from 'react';
import { useLanguage } from "@/contexts/language-context";

export function AssignmentMakerTab() {
  const [topic, setTopic] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [result, setResult] = useState<AssignmentMakerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleGenerateAssignment = () => {
    if (!topic.trim()) {
      toast({
        title: t("assignment.toast.topic_empty_title"),
        description: t("assignment.toast.topic_empty_desc"),
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);

    startTransition(async () => {
      try {
        const assignmentResult = await assignmentMaker({ topic, instructions });
        if (assignmentResult) {
          setResult(assignmentResult);
        } else {
          throw new Error(t("assignment.toast.no_result_error"));
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t("unknown_error");
        setError(`${t("assignment.toast.generation_failed_desc")} ${errorMessage}`);
        toast({
          title: t("assignment.toast.generation_failed_title"),
          description: t("assignment.toast.generation_failed_desc"),
          variant: "destructive",
        });
      }
    });
  };
  
  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: t("copied_title"),
      description: t("assignment.toast.copied_desc"),
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

      const drawTextWithWrapping = (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; isBold?: boolean; }) => {
        const { font, size, color, lineHeight, x, maxWidth } = options;
        let words = text.split(' ');
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, size);

            if (textWidth > maxWidth) {
                if (y < lineHeight + margin) {
                    page = pdfDoc.addPage();
                    y = height - margin;
                }
                page.drawText(currentLine, { x, y, font, size, color, lineHeight });
                y -= lineHeight;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            if (y < lineHeight + margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
            page.drawText(currentLine, { x, y, font, size, color, lineHeight });
            y -= lineHeight;
        }
      };

      // Title
      drawTextWithWrapping(result.title, { font: helveticaBoldFont, size: 18, color: rgb(0,0,0), lineHeight: 22, x: margin, maxWidth: width - 2*margin });
      y -= 20;

      // Content
      const contentLines = result.content.split('\n');
      for (const line of contentLines) {
        if (line.trim().startsWith("#")) { // Simple markdown for headings
             drawTextWithWrapping(line.replace(/#/g, '').trim(), { font: helveticaBoldFont, size: 14, color: rgb(0,0,0), lineHeight: 18, x: margin, maxWidth: width - 2*margin });
        } else {
            drawTextWithWrapping(line, { font: helveticaFont, size: 11, color: rgb(0.1, 0.1, 0.1), lineHeight: 15, x: margin, maxWidth: width - 2*margin });
        }
        if (line.trim() === '') y -= 10; // Add space for paragraphs
      }
      y -= 10;
      
      // References
      if (result.references.length > 0) {
        if (y < margin + 40) { // Check space for header + one line
            page = pdfDoc.addPage();
            y = height - margin;
        }
        drawTextWithWrapping('References', { font: helveticaBoldFont, size: 14, color: rgb(0,0,0), lineHeight: 18, x: margin, maxWidth: width - 2*margin });
        y -= 10;

        for (const ref of result.references) {
           drawTextWithWrapping(`- ${ref}`, { font: helveticaFont, size: 10, color: rgb(0.3, 0.3, 0.3), lineHeight: 14, x: margin, maxWidth: width - 2*margin });
        }
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
      link.download = `assign-mentor-${result.title.replace(/\s+/g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (pdfError) {
        console.error("Failed to generate PDF:", pdfError);
        toast({
            variant: "destructive",
            title: t("pdf_error_title"),
            description: t("pdf_error_desc")
        });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="assignment-topic" className="font-semibold text-md">
            {t("assignment.topic_label")}
          </Label>
          <Input
            id="assignment-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t("assignment.topic_placeholder")}
            className="bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
           <Label htmlFor="assignment-instructions" className="font-semibold text-md">
            {t("assignment.instructions_label")}
          </Label>
          <Textarea
            id="assignment-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={t("assignment.instructions_placeholder")}
            className="h-72 resize-y bg-background focus-visible:ring-accent"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-4">
            <Label className="font-semibold text-md">
                {t("assignment.output_label")}
            </Label>
            <Card className="min-h-96 bg-background/50 flex flex-col">
                <CardContent className="flex-grow flex items-center justify-center p-6">
                    {isPending && (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-500">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-semibold">{t("assignment.status.generating")}</p>
                            <p className="text-sm text-center">{t("assignment.status.writing")}</p>
                        </div>
                    )}
                    {!isPending && !result && (
                         <div className="text-center text-muted-foreground p-4">
                             <p>{t("assignment.status.placeholder")}</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <ScrollArea className="h-[32rem] w-full">
                            <div className="w-full flex flex-col gap-4 animate-in fade-in duration-500 pr-4">
                                <h2 className="text-2xl font-bold tracking-tight">{result.title}</h2>
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground whitespace-pre-wrap font-serif">
                                  {result.content.split(/(\*\*.*?\*\*|#{1,6}\s.*)/g).map((text, index) => {
                                      if (text.startsWith('**') && text.endsWith('**')) {
                                          return <strong key={index}>{text.slice(2,-2)}</strong>;
                                      }
                                      if (text.match(/^#+\s/)) {
                                          const level = text.match(/^#+/)?.[0].length || 1;
                                          const content = text.replace(/^#+\s/, '');
                                          return React.createElement(`h${level > 6 ? 6 : level}`, { key: index, className: 'font-bold' }, content);
                                      }
                                      return <span key={index}>{text}</span>
                                  })}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mt-4 mb-2"><BookCheck className="h-5 w-5"/> {t("references")}</h3>
                                    <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 font-mono">
                                        {result.references.length > 0 ? (
                                            result.references.map((ref, index) => (
                                            <li key={index}>{ref}</li>
                                            ))
                                        ) : (
                                            <li>{t("assignment.no_references")}</li>
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
         {result && !isPending && (
            <div className="flex flex-wrap items-center justify-center gap-4">
                 <Button
                    onClick={() => handleCopy(result.content)}
                    variant="outline"
                    size="lg"
                    className="transition-all duration-300 hover:scale-105"
                >
                    <Copy className="mr-2 h-5 w-5" />
                    {t("copy_text_button")}
                </Button>
                <Button
                    onClick={handleDownloadPdf}
                    variant="outline"
                    size="lg"
                    className="transition-all duration-300 hover:scale-105"
                >
                    <Download className="mr-2 h-5 w-5" />
                    {t("download_pdf_button")}
                </Button>
            </div>
         )}
        <Button
          onClick={handleGenerateAssignment}
          disabled={!topic.trim() || isPending}
          size="lg"
          className={cn(
            "w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto mt-4",
            isPending && "animate-sparkle"
          )}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          <span>{isPending ? t("button.generating") : t("assignment.generate_button")}</span>
        </Button>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
