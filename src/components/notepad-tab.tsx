
"use client";

import { useState, useEffect } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

        page.drawText("Tex.io Notepad", { 
            x: margin, 
            y, 
            font: helveticaFont, 
            size: 18, 
            color: rgb(0,0,0)
        });
        y -= 30;

        const lines = notes.split('\n');
        for (const line of lines) {
            if (y < margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
            page.drawText(line, {
                x: margin,
                y: y,
                font: helveticaFont,
                size: 12,
                color: rgb(0.2, 0.2, 0.2),
                maxWidth: width - 2 * margin,
                lineHeight: 15,
            });
            y -= 15;
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "texio-notepad.pdf";
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
