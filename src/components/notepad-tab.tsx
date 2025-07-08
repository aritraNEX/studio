"use client";

import { useState, useEffect } from "react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

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

  const handleDownloadPdf = () => {
    if (!notes) return;

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("Tex.io Notepad", 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    const splitText = doc.splitTextToSize(notes, 180);
    doc.text(splitText, 14, 32);

    doc.save("texio-notepad.pdf");
    toast({
      title: "PDF Downloaded",
      description: "Your notes have been saved as a PDF.",
    });
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
