"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText } from "@/ai/flows/paraphrase-image-text";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Operation = 'paraphrase' | 'summarize' | 'translate';

const extraordinaryFonts = [
  "Poppins",
  "Playfair Display",
  "Montserrat",
  "Raleway",
  "Oswald",
  "Lora",
  "Merriweather",
  "Cormorant Garamond",
  "Nunito",
  "Josefin Sans",
  "Lobster",
  "Pacifico",
  "Caveat",
  "Dancing Script",
  "Anton",
  "Bebas Neue",
  "Indie Flower",
  "Shadows Into Light",
  "Ubuntu",
  "Quattrocento",
];

interface OperationTabProps {
  operation: Operation;
}

export function OperationTab({ operation }: OperationTabProps) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const [selectedFont, setSelectedFont] = useState<string>("Poppins");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setImageDataUrl(result);
        setGeneratedText("");
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
        handleImageUpload(file);
    }
  };

  const handleProcess = () => {
    if (!imageDataUrl) return;
    if (operation === 'translate' && !targetLanguage.trim()) {
        toast({
            title: "Language required",
            description: "Please enter a target language for translation.",
            variant: "destructive",
        });
        return;
    }

    setError(null);
    setGeneratedText("");
    startTransition(async () => {
      try {
        const result = await processImageText({ 
            photoDataUri: imageDataUrl,
            operation,
            ...(operation === 'translate' ? { targetLanguage } : {})
        });
        if (result && result.processedText) {
          setGeneratedText(result.processedText);
        } else {
          throw new Error("The processed text is empty.");
        }
      } catch (e) {
        console.error(e);
        setError(`Failed to ${operation} text. Please try again.`);
        toast({
          title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Error`,
          description: `An error occurred. Please try another image.`,
          variant: "destructive",
        });
      }
    });
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied to clipboard!",
      description: "The result has been copied.",
    });
  };

  const handleDownloadPdf = () => {
    if (!generatedText) return;

    const doc = new jsPDF();

    // Use a standard font for reliable PDF generation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Tex.io Result - ${operation.charAt(0).toUpperCase() + operation.slice(1)}`, 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // The splitTextToSize function will use the currently set font
    const splitText = doc.splitTextToSize(generatedText, 180);
    doc.text(splitText, 14, 32);

    doc.save(`texio-result-${operation}.pdf`);
    toast({
        title: "PDF Downloaded",
        description: "Your result has been saved as a PDF.",
    });
  };

  const buttonText = {
      paraphrase: 'Paraphrase',
      summarize: 'Summarize',
      translate: 'Translate'
  }[operation];

  const buttonTextPending = {
      paraphrase: 'Paraphrasing...',
      summarize: 'Summarizing...',
      translate: 'Translating...'
  }[operation];

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label htmlFor={`image-upload-${operation}`} className="font-semibold text-md">
          Upload Image
        </Label>
        <div className="relative">
          <input
            type="file"
            id={`image-upload-${operation}`}
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
            accept="image/*"
          />
          <label
            htmlFor={`image-upload-${operation}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "group flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
              "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
            )}
          >
            {imageDataUrl ? (
              <div className="relative w-full h-full p-2">
                <Image
                  src={imageDataUrl}
                  alt="Uploaded text"
                  fill
                  className="rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">Any common image format</p>
              </div>
            )}
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-4 h-full">
        {operation === 'translate' && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-300">
            <Label htmlFor={`language-input-${operation}`} className="font-semibold text-md">
              Translate to
            </Label>
            <Input 
              id={`language-input-${operation}`}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              placeholder="e.g., Spanish, French, Japanese"
              className="bg-background/50 focus-visible:ring-accent"
            />
          </div>
        )}

        <Label htmlFor={`output-text-${operation}`} className="font-semibold text-md">
          Result
        </Label>
        <div className="relative flex-grow min-h-[24rem]">
          <Textarea
            id={`output-text-${operation}`}
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
            placeholder={isPending ? "Generating..." : "Your result will appear here..."}
            className="h-full resize-y pr-24 bg-background focus-visible:ring-accent"
            style={{ fontFamily: selectedFont }}
          />
          <div className="absolute top-2 right-2 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={!generatedText || isPending}
              aria-label="Copy to clipboard"
            >
              <Copy className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleDownloadPdf}
              disabled={!generatedText || isPending}
              aria-label="Download as PDF"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 py-4">
         <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={handleProcess}
            disabled={!imageDataUrl || isPending || (operation === 'translate' && !targetLanguage.trim())}
            size="lg"
            className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 sm:w-auto"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isPending ? buttonTextPending : buttonText}
          </Button>

          {generatedText && (
            <div className="flex items-center gap-2 animate-in fade-in duration-500">
              <Label htmlFor={`font-select-${operation}`} className="text-sm font-medium">
                Font:
              </Label>
              <Select onValueChange={setSelectedFont} defaultValue={selectedFont}>
                <SelectTrigger id={`font-select-${operation}`} className="w-[180px] bg-background">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  {extraordinaryFonts.map((font) => (
                    <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
