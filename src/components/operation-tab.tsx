
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, Upload, Download, ChevronDown, Send, AudioLines, Share2 } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useABTest } from "@/contexts/ab-test-context";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useWorkspace } from "@/contexts/workspace-context";

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts';

const extraordinaryFonts = [
  "Poppins", "Playfair Display", "Montserrat", "Raleway", "Oswald", "Lora",
  "Merriweather", "Cormorant Garamond", "Nunito", "Josefin Sans", "Lobster",
  "Pacifico", "Caveat", "Dancing Script", "Anton", "Bebas Neue", "Indie Flower",
  "Shadows Into Light", "Ubuntu", "Quattrocento",
];

const allOperations: Operation[] = ['paraphrase', 'summarize', 'translate', 'style', 'tts'];

interface OperationTabProps {
  operation: Operation;
  onSendTo: (text: string, operation: Operation) => void;
  initialText?: string;
  projectId?: string | null;
}

export function OperationTab({ operation, onSendTo, initialText, projectId }: OperationTabProps) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(initialText ?? null);
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
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [appUrl, setAppUrl] = useState('');
  const { group } = useABTest();
  const { user } = useAuth();
  const { setWorkspaceText, setWorkspaceOperation } = useWorkspace();

  useEffect(() => {
    setAppUrl(window.location.origin); // Use origin instead of href
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (error) {
      console.error("Failed to set pdf.js worker source", error);
    }
  }, []);

  useEffect(() => {
    if (projectId && user) {
      const fetchProject = async () => {
        const docRef = doc(db, 'projects', projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const projectData = docSnap.data();
          if (projectData.userId !== user.uid) {
             toast({ variant: 'destructive', title: 'Access Denied', description: "You don't have permission to view this project." });
             return;
          }
          setWorkspaceText(projectData.inputText);
          setWorkspaceOperation(projectData.operation);
          setGeneratedText(projectData.outputText);
          // Pre-fill the correct tab based on operation
          if (projectData.operation === operation) {
            setExtractedText(projectData.inputText);
            setGeneratedText(projectData.outputText);
          }
        } else {
          toast({ variant: 'destructive', title: 'Project not found.' });
        }
      };
      fetchProject();
    }
  }, [projectId, user, operation, setWorkspaceText, setWorkspaceOperation, toast]);

  useEffect(() => {
      if (initialText) {
          setExtractedText(initialText);
          setGeneratedText("");
      }
  }, [initialText]);

  const handleSaveProject = async (inputText: string, outputText: string, projectOperation: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        inputText,
        outputText,
        operation: projectOperation,
        createdAt: serverTimestamp(),
      });
      toast({title: "Project Saved!", description: "Your work has been saved to your dashboard."})
    } catch (error) {
      console.error("Error saving project: ", error);
      toast({ variant: 'destructive', title: 'Could not save project.' });
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setImageDataUrl(null);
    setExtractedText(null);
    setGeneratedText("");
    setError(null);
    setIsParsing(true);

    const fileType = file.type;
    const reader = new FileReader();

    reader.onerror = () => {
        setIsParsing(false);
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
    };

    reader.onload = async (e) => {
        try {
            if (fileType.startsWith("image/")) {
                const result = e.target?.result;
                if (typeof result === "string") {
                    setImageDataUrl(result);
                }
            } else if (fileType === 'application/pdf') {
                const buffer = e.target?.result as ArrayBuffer;
                const pdf = await pdfjsLib.getDocument(buffer).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                }
                setExtractedText(text);
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const buffer = e.target?.result as ArrayBuffer;
                const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                setExtractedText(result.value);
            } else {
                 toast({
                    title: "Unsupported file type",
                    description: "Please upload an image, PDF, or DOCX file.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Failed to parse file", error);
            toast({ variant: 'destructive', title: 'File Parse Error', description: `Could not read the contents of ${file.name}. The file might be corrupted or in an unsupported format.` });
        } finally {
            setIsParsing(false);
        }
    };
    
    if (fileType.startsWith("image/") || fileType === 'application/pdf' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
         if (fileType.startsWith("image/")) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
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
    const currentInput = imageDataUrl || extractedText;
    if (!currentInput || (typeof currentInput === 'string' && !currentInput.trim())) {
        toast({
            variant: 'destructive',
            title: 'No content to process',
            description: 'Please upload a file or make sure the input text is not empty.',
        });
        return;
    }
    
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
        const result = await processImageText(inputPayload as any);
        if (result && result.processedText) {
          setGeneratedText(result.processedText);
          await handleSaveProject(extractedText || 'Image Input', result.processedText, operation);
        } else {
          throw new Error("The processed text is empty.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Failed to ${operation} text. Please try again.`);
        toast({
          title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Error`,
          description: errorMessage,
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

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email', text: string) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(appUrl);
    const title = `Result from Tex.io - ${operation}`;

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent(title)}&summary=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`;
        break;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const isButtonBVariant = group === 'B';

  const buttonText = isButtonBVariant ? "Generate Now" : {
      paraphrase: 'Paraphrase',
      summarize: 'Summarize',
      translate: 'Translate',
      style: 'Apply Style'
  }[operation as 'paraphrase' | 'summarize' | 'translate' | 'style'];

  const buttonTextPending = {
      paraphrase: 'Paraphrasing...',
      summarize: 'Summarizing...',
      translate: 'Translating...',
      style: 'Applying Style...'
  }[operation as 'paraphrase' | 'summarize' | 'translate' | 'style'];

  const finalStyle = customStyle.trim() || targetStyle;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label htmlFor={`image-upload-${operation}`} className="font-semibold text-md">
          {initialText ? "Input Text" : "Upload File"}
        </Label>
        
        {initialText ? (
             <div className="w-full h-96 p-4 overflow-y-auto bg-background/30 rounded-lg border">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">{initialText}</p>
            </div>
        ) : (
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
        )}
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
            {isPending ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background/50 rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-semibold">Generating your result...</p>
                </div>
            ) : (
                <Textarea
                    ref={outputTextareaRef}
                    id={`output-text-${operation}`}
                    value={generatedText}
                    onChange={(e) => setGeneratedText(e.target.value)}
                    placeholder={"Your result will appear here..."}
                    className="h-full resize-y pr-36 bg-background focus-visible:ring-accent"
                    style={{ fontFamily: selectedFont }}
                />
            )}
          
          {!isPending && (
            <div className="absolute top-2 right-2 flex items-center">
                 {generatedText && onSendTo && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <Send className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {allOperations.filter(op => op !== operation).map(op => (
                                <DropdownMenuItem key={op} onClick={() => onSendTo(generatedText, op)}>
                                    Send to {op === 'tts' ? 'Text to Speech' : op.charAt(0).toUpperCase() + op.slice(1)}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                 )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            disabled={!generatedText || isPending}
                            aria-label="Share result"
                        >
                            <Share2 className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare('twitter', generatedText)}>Twitter</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('facebook', generatedText)}>Facebook</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('linkedin', generatedText)}>LinkedIn</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('whatsapp', generatedText)}>WhatsApp</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('email', generatedText)}>Email</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
          )}
        </div>
        
        {generatedText && (
          <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-muted/50 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button 
                    onClick={() => onSendTo(generatedText, 'tts')} 
                    className="w-full"
                >
                    <AudioLines className="mr-2 h-5 w-5" />
                    Listen with Text-to-Speech
                </Button>
            </div>
          </div>
        )}
      </div>
      <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 py-4">
         <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={handleProcess}
            disabled={(!imageDataUrl && !extractedText?.trim()) || isPending || isParsing || (operation === 'translate' && !targetLanguage.trim()) || (operation === 'style' && !finalStyle)}
            size="lg"
            variant={isButtonBVariant ? "outline" : "default"}
            className={cn(
              "w-full max-w-xs text-lg font-semibold transition-all duration-300 hover:scale-105 sm:w-auto",
              isButtonBVariant 
                ? "border-2 border-primary text-primary hover:text-primary hover:bg-primary/10" 
                : "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
            )}
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
