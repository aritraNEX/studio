"use client";

import { useState, useRef, useTransition, useEffect } from "react";
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
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style';

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
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const [targetStyle, setTargetStyle] = useState<string>('Formal');
  const [customStyle, setCustomStyle] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>("Poppins");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (error) {
      console.error("Failed to set pdf.js worker source", error);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setImageDataUrl(null);
    setExtractedText(null);
    setGeneratedText("");
    setError(null);
    setIsParsing(true);

    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setImageDataUrl(result);
        }
        setIsParsing(false);
      };
      reader.readAsDataURL(file);
    } else if (fileType === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument(buffer).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\\n';
          }
          setExtractedText(text);
        } catch (error) {
          console.error("Failed to parse PDF", error);
          toast({ variant: 'destructive', title: 'Could not read PDF file.' });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          setExtractedText(result.value);
        } catch (error) {
          console.error("Failed to parse DOCX", error);
          toast({ variant: 'destructive', title: 'Could not read DOCX file.' });
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image, PDF, or DOCX file.",
        variant: "destructive",
      });
      setIsParsing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleProcess = () => {
    if (!imageDataUrl && !extractedText) return;
    
    const finalStyle = customStyle.trim() || targetStyle;

    if (operation === 'translate' && !targetLanguage.trim()) {
        toast({
            title: "Language required",
            description: "Please enter a target language for translation.",
            variant: "destructive",
        });
        return;
    }

    if (operation === 'style' && !finalStyle) {
      toast({
          title: "Style required",
          description: "Please select or enter a style for rewriting.",
          variant: "destructive",
      });
      return;
    }

    setError(null);
    setGeneratedText("");
    startTransition(async () => {
      try {
        const inputPayload = {
            operation,
            ...(operation === 'translate' ? { targetLanguage } : {}),
            ...(operation === 'style' ? { targetStyle: finalStyle } : {}),
            ...(imageDataUrl ? { photoDataUri: imageDataUrl } : { text: extractedText! })
        };
        const result = await processImageText(inputPayload);
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
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Tex.io Result - ${operation.charAt(0).toUpperCase() + operation.slice(1)}`, 14, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
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
      translate: 'Translate',
      style: 'Apply Style'
  }[operation];

  const buttonTextPending = {
      paraphrase: 'Paraphrasing...',
      summarize: 'Summarizing...',
      translate: 'Translating...',
      style: 'Applying Style...'
  }[operation];

  const finalStyle = customStyle.trim() || targetStyle;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label htmlFor={`image-upload-${operation}`} className="font-semibold text-md">
          Upload File
        </Label>
        <div className="relative">
          <input
            type="file"
            id={`image-upload-${operation}`}
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
            accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
            {isParsing ? (
               <div className="flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Parsing your file...</p>
              </div>
            ) : imageDataUrl ? (
              <div className="relative w-full h-full p-2">
                <Image
                  src={imageDataUrl}
                  alt="Uploaded content"
                  fill
                  className="rounded-lg object-contain"
                />
              </div>
            ) : extractedText ? (
                <div className="w-full h-full p-4 overflow-y-auto bg-background/30 rounded-lg">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Extracted Text Preview:</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{extractedText.substring(0, 1000)}{extractedText.length > 1000 && '...'}</p>
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">Image, PDF, or DOCX files</p>
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

        {operation === 'style' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="flex flex-col gap-2">
                <Label htmlFor={`style-select-${operation}`} className="font-semibold text-md">
                Choose a Style
                </Label>
                <Select onValueChange={setTargetStyle} defaultValue={targetStyle} disabled={!!customStyle.trim()}>
                    <SelectTrigger id={`style-select-${operation}`} className="bg-background/50 focus-visible:ring-accent">
                    <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Formal">Formal</SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Confident">Confident</SelectItem>
                        <SelectItem value="Poetic">Poetic</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="relative flex items-center justify-center">
                <div className="flex-grow border-t border-muted-foreground/20"></div>
                <span className="flex-shrink mx-2 text-xs text-muted-foreground">OR</span>
                <div className="flex-grow border-t border-muted-foreground/20"></div>
            </div>
             <div className="flex flex-col gap-2">
                <Label htmlFor={`custom-style-input-${operation}`} className="font-semibold text-md">
                    Enter a Famous Author
                </Label>
                <Input 
                    id={`custom-style-input-${operation}`}
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="e.g., William Shakespeare, Jane Austen"
                    className="bg-background/50 focus-visible:ring-accent"
                />
            </div>
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
            disabled={(!imageDataUrl && !extractedText) || isPending || isParsing || (operation === 'translate' && !targetLanguage.trim()) || (operation === 'style' && !finalStyle)}
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
