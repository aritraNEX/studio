
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, Upload, Download, Volume2, ChevronDown, CheckCircle, File as FileIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText } from "@/ai/flows/paraphrase-image-text";
import { textToSpeech } from "@/ai/flows/text-to-speech-flow";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style';
type FileStatus = 'pending' | 'parsing' | 'ready' | 'processing' | 'done' | 'error';

interface ProcessedFile {
    id: string;
    file: File;
    status: FileStatus;
    extractedText?: string;
    generatedText?: string;
    error?: string;
}

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

const voices = ['Algenib', 'Achernar', 'Schedar', 'Umbriel', 'Zephyr'];

interface OperationTabProps {
  operation: Operation;
}

export function OperationTab({ operation }: OperationTabProps) {
  // Single file state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>("");
  
  // Batch processing state
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const [targetStyle, setTargetStyle] = useState<string>('Formal');
  const [customStyle, setCustomStyle] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>("Poppins");
  const [selectedVoice, setSelectedVoice] = useState<string>(voices[0]);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (error) {
      console.error("Failed to set pdf.js worker source", error);
    }
  }, []);

   const parseFile = async (fileToParse: ProcessedFile): Promise<string> => {
        return new Promise((resolve, reject) => {
            const { file } = fileToParse;
            const fileType = file.type;
            const reader = new FileReader();

            reader.onerror = () => {
                reader.abort();
                reject(new DOMException("Problem parsing input file."));
            };
            
            reader.onload = async (e) => {
                try {
                    const buffer = e.target?.result as ArrayBuffer;
                    let text = '';
                    if (fileType.startsWith("image/")) {
                       // For batch, we just pass the data URL which is handled by the flow
                       const readerForDataUrl = new FileReader();
                       readerForDataUrl.onload = (e) => resolve(e.target?.result as string);
                       readerForDataUrl.readAsDataURL(file);
                       return;
                    } else if (fileType === 'application/pdf') {
                        const pdf = await pdfjsLib.getDocument(buffer).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                        }
                    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                        text = result.value;
                    }
                    resolve(text);
                } catch (err) {
                    reject(err);
                }
            };

            if (fileType.startsWith("image/")) {
                reader.readAsDataURL(file); // This will trigger the onload with a data URL
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    };

  const handleFileUpload = (file: File) => {
     if (!file) return;

    if (operation === 'summarize') {
        const newFile: ProcessedFile = { id: `${file.name}-${Date.now()}`, file, status: 'pending' };
        setFiles(prev => [...prev, newFile]);
        handleFileParsing(newFile);
    } else {
        setImageDataUrl(null);
        setExtractedText(null);
        setGeneratedText("");
        setError(null);
        setIsParsing(true);
        setAudioUrl(null);

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
                text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
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
    }
  };

   const handleFileParsing = async (fileToParse: ProcessedFile) => {
        setFiles(prev => prev.map(f => f.id === fileToParse.id ? { ...f, status: 'parsing' } : f));
        try {
            const text = await parseFile(fileToParse);
            setFiles(prev => prev.map(f => f.id === fileToParse.id ? { ...f, extractedText: text, status: 'ready' } : f));
        } catch (error) {
            console.error("Failed to parse file", error);
            setFiles(prev => prev.map(f => f.id === fileToParse.id ? { ...f, status: 'error', error: 'Failed to parse' } : f));
            toast({ variant: 'destructive', title: `Could not read file: ${fileToParse.file.name}` });
        }
    };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
        Array.from(selectedFiles).forEach(file => handleFileUpload(file));
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles) {
        Array.from(droppedFiles).forEach(file => handleFileUpload(file));
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }

  const handleBatchProcess = async () => {
    setIsBatchProcessing(true);
    for (const file of files) {
        if (file.status === 'ready') {
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f));
            try {
                const isImage = file.file.type.startsWith("image/");
                const inputPayload = {
                    operation: 'summarize',
                    ...(isImage ? { photoDataUri: file.extractedText! } : { text: file.extractedText! })
                };
                const result = await processImageText(inputPayload);
                if (result && result.processedText) {
                    setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'done', generatedText: result.processedText } : f));
                } else {
                    throw new Error("The processed text is empty.");
                }
            } catch (e) {
                console.error(e);
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'error', error: `Failed to summarize.` } : f));
            }
        }
    }
    setIsBatchProcessing(false);
  };
    
    const handleDownloadAll = () => {
        const doc = new jsPDF();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(`Tex.io Summaries`, 14, 22);
        
        let yPos = 32;

        files.forEach((file, index) => {
            if (file.status === 'done' && file.generatedText) {
                if(yPos > 260) {
                   doc.addPage();
                   yPos = 22;
                }
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Summary for: ${file.file.name}`, 14, yPos);
                yPos += 8;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                
                const splitText = doc.splitTextToSize(file.generatedText, 180);
                doc.text(splitText, 14, yPos);
                yPos += (splitText.length * 5) + 10;
            }
        });

        doc.save("texio-summaries.pdf");
        toast({
            title: "PDF Downloaded",
            description: "All summaries have been saved as a single PDF.",
        });
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
    setAudioUrl(null);
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

  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard!",
      description: "The result has been copied.",
    });
  };

  const handleDownloadPdf = (textToDownload: string, fileName: string) => {
    if (!textToDownload) return;

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`Tex.io Result - ${operation.charAt(0).toUpperCase() + operation.slice(1)}`, 14, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const splitText = doc.splitTextToSize(textToDownload, 180);
    doc.text(splitText, 14, 32);

    doc.save(fileName);
    toast({
        title: "PDF Downloaded",
        description: "Your result has been saved as a PDF.",
    });
  };

  const handleListen = async () => {
    if (operation === 'summarize' || !generatedText) return;
    
    const textarea = outputTextareaRef.current;
    let textToSpeak = generatedText;

    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      textToSpeak = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    }

    if (!textToSpeak.trim()) {
      return;
    }

    setIsGeneratingSpeech(true);
    setAudioUrl(null);
    try {
        const result = await textToSpeech({
            text: textToSpeak,
            voice: selectedVoice as any,
        });
        setAudioUrl(result.audioDataUri);
    } catch (e) {
        console.error("Failed to generate speech", e);
        toast({
            title: "Speech Generation Failed",
            description: "Could not convert text to speech. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsGeneratingSpeech(false);
    }
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

  if (operation === 'summarize') {
    const readyFilesCount = files.filter(f => f.status === 'ready').length;
    const processedFilesCount = files.filter(f => f.status === 'done').length;
    const progress = files.length > 0 ? (processedFilesCount / files.length) * 100 : 0;
    
    return (
        <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Upload Area */}
            <div className="flex flex-col gap-4">
                 <Label htmlFor={`image-upload-${operation}`} className="font-semibold text-md">
                    Upload Files for Batch Summary
                </Label>
                <input
                    type="file"
                    id={`image-upload-${operation}`}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="sr-only"
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                />
                 <label
                    htmlFor={`image-upload-${operation}`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "group flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                        "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
                    )}
                >
                     <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center p-4">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                        <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">Image, PDF, or DOCX files</p>
                    </div>
                </label>
                {files.length > 0 && (
                    <Card className="max-h-96 overflow-y-auto">
                        <CardContent className="p-4 space-y-3">
                            {files.map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                                    <FileIcon className="h-5 w-5 text-primary" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate">{f.file.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{f.status}</p>
                                    </div>
                                    {f.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {f.status === 'done' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleRemoveFile(f.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Results Area */}
            <div className="flex flex-col gap-4 h-full">
                <Label className="font-semibold text-md">
                    Summaries
                </Label>
                <div className="relative flex-grow min-h-[24rem]">
                    {files.filter(f => f.status === 'done').length > 0 ? (
                        <Accordion type="single" collapsible className="w-full max-h-[36rem] overflow-y-auto pr-2">
                             {files.filter(f => f.status === 'done').map(file => (
                                <AccordionItem key={file.id} value={file.id}>
                                    <AccordionTrigger>{file.file.name}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="relative">
                                            <Textarea
                                                readOnly
                                                value={file.generatedText}
                                                className="h-48 resize-y pr-24 bg-background/30"
                                            />
                                            <div className="absolute top-2 right-2 flex items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleCopy(file.generatedText!)}
                                                >
                                                    <Copy className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleDownloadPdf(file.generatedText!, `texio-summary-${file.file.name}.pdf`)}
                                                >
                                                    <Download className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                             ))}
                        </Accordion>
                    ) : (
                         <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4 bg-muted/20 rounded-lg">
                            <p>Your summaries will appear here after processing.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
             <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 py-4">
                {files.length > 0 && (
                    <div className="w-full max-w-md animate-in fade-in duration-300">
                        <div className="flex justify-between mb-1">
                             <span className="text-sm font-medium text-muted-foreground">Processing Progress</span>
                             <span className="text-sm font-medium">{processedFilesCount} / {files.length} done</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Button
                        onClick={handleBatchProcess}
                        disabled={readyFilesCount === 0 || isBatchProcessing}
                        size="lg"
                        className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 sm:w-auto"
                    >
                        {isBatchProcessing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        {isBatchProcessing ? "Summarizing..." : `Summarize All (${readyFilesCount})`}
                    </Button>
                    {processedFilesCount > 0 && (
                        <Button
                            onClick={handleDownloadAll}
                            variant="outline"
                            size="lg"
                            className="w-full max-w-xs text-lg font-semibold transition-all duration-300 hover:scale-105 sm:w-auto"
                            disabled={isBatchProcessing}
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download All
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
  }

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
            multiple={operation === 'summarize'}
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
            ref={outputTextareaRef}
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
              onClick={() => handleCopy(generatedText)}
              disabled={!generatedText || isPending}
              aria-label="Copy to clipboard"
            >
              <Copy className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleDownloadPdf(generatedText, `texio-result-${operation}.pdf`)}
              disabled={!generatedText || isPending}
              aria-label="Download as PDF"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {generatedText && (
          <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-muted/50 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-grow w-full flex items-center gap-2">
                    <Label htmlFor={`voice-select-${operation}`} className="text-sm font-medium whitespace-nowrap">
                        Voice:
                    </Label>
                    <Select onValueChange={setSelectedVoice} defaultValue={selectedVoice}>
                        <SelectTrigger id={`voice-select-${operation}`} className="w-full bg-background">
                        <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                        {voices.map((voice) => (
                            <SelectItem key={voice} value={voice}>
                            {voice}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button 
                    onClick={handleListen} 
                    disabled={isGeneratingSpeech} 
                    className="w-full sm:w-auto"
                >
                    {isGeneratingSpeech ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                    <Volume2 className="mr-2 h-5 w-5" />
                    )}
                    {isGeneratingSpeech ? 'Generating...' : 'Listen'}
                </Button>
            </div>
            {audioUrl && (
              <div className="mt-2 animate-in fade-in duration-500">
                <audio controls autoPlay className="w-full h-10">
                  <source src={audioUrl} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}
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

    