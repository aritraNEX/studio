
"use client";

import { useState, useEffect } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export function NotepadTab() {
  const [notes, setNotes] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("texio-notepad");
      if (savedNotes) {
        setNotes(savedNotes);
      }
    } catch (error) {
      console.warn("Could not read from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("texio-notepad", notes);
    } catch (error) {
      console.warn("Could not write to localStorage", error);
    }
  }, [notes]);

  const handleCopy = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    toast({
      title: "Copied to clipboard!",
      description: "Your notes have been copied.",
    });
  };

  const handleDownloadPdf = async () => {
    if (!notes) return;

    try {
        const pdfDoc = await PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const margin = 50;
        let y = height - margin;

        const drawTextWithWrapping = (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; }) => {
            const { font, size, color, lineHeight, x, maxWidth } = options;
            const words = text.split(' ');
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

        const lines = notes.split('\n');
        for (const line of lines) {
            drawTextWithWrapping(line, {
                font: helveticaFont, size: 12, color: rgb(0.2, 0.2, 0.2), lineHeight: 15, x: margin, maxWidth: width - 2 * margin,
            });
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
        link.download = "vesper-notepad.pdf";
        link.click();
        URL.revokeObjectURL(link.href);

        toast({
            title: "PDF Downloaded",
            description: "Your notes have been saved as a PDF.",
        });

    } catch(err) {
        toast({
            variant: "destructive",
            title: "PDF Download Failed",
            description: "Could not generate the PDF for your notes.",
        });
        console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
        <Label htmlFor="notepad-textarea" className="font-semibold text-md">
            Your Personal Notepad
        </Label>
        <div className="relative flex-grow min-h-[28rem]">
            <Textarea
                id="notepad-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start typing... your notes are saved automatically in your browser."
                className="h-full resize-y pr-24 bg-background focus-visible:ring-accent"
            />
            <div className="absolute top-2 right-2 flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleCopy}
                    disabled={!notes}
                    aria-label="Copy to clipboard"
                >
                    <Copy className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleDownloadPdf}
                    disabled={!notes}
                    aria-label="Download as PDF"
                >
                    <Download className="h-5 w-5" />
                </Button>
            </div>
        </div>
    </div>
  );
}
