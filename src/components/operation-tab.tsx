
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Copy, Loader2, Sparkles, Upload, Download, ChevronDown, Send, AudioLines, Share2, Link, Save, FileText, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText } from "@/ai/flows/paraphrase-image-text";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { useWorkspace } from "@/contexts/workspace-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/loading-context";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { SpeechRecognitionButton } from "./speech-recognition-button";


type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts' | 'grammar';

const extraordinaryFonts = [
  "Poppins", "Playfair Display", "Montserrat", "Raleway", "Oswald", "Lora",
  "Merriweather", "Cormorant Garamond", "Nunito", "Josefin Sans", "Lobster",
  "Pacifico", "Caveat", "Dancing Script", "Anton", "Bebas Neue", "Indie Flower",
  "Shadows Into Light", "Ubuntu", "Quattrocento",
];

const allOperations: Operation[] = ['paraphrase', 'summarize', 'translate', 'style', 'tts', 'grammar'];

interface OperationTabProps {
  operation: Operation;
  onSendTo: (text: string, operation: Operation) => void;
}

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export function OperationTab({ operation, onSendTo }: OperationTabProps) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { workspaceText } = useWorkspace();
  const [inputText, setInputText] = useState<string>("");
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [isParsing, setIsParsing] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>('Spanish');
  const [targetStyle, setTargetStyle] = useState<string>('Formal');
  const [customStyle, setCustomStyle] = useState<string>('');
  const [selectedFont, setSelectedFont] = useState<string>("Poppins");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [appUrl, setAppUrl] = useState('');
  const { user } = useAuth();
  const { addWorkspaceStep, setWorkspaceText } = useWorkspace();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition({
      onTranscript: (transcript) => {
        setInputText(prev => prev + transcript);
      }
  });


  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
  }, []);

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if(workspaceText && operation !== 'style' && operation !== 'translate'){
        setInputText(workspaceText);
        setWorkspaceText("");
    }
  }, [workspaceText, operation, setWorkspaceText]);

  useEffect(() => {
    if (projectId && user) {
      const fetchProject = async () => {
        setIsParsing(true); // Show loading state while fetching
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const userData = docSnap.data();
              const project = userData.projects?.find((p: any) => p.id === projectId);
              
              if (project) {
                 if (project.operation === operation) {
                    setGeneratedText(project.outputText);
                    const savedInput = project.inputText;
                    if (savedInput) {
                        if (savedInput.startsWith('data:')) {
                            setFileDataUri(savedInput);
                            setFileName("Loaded Project Document");
                            if (savedInput.startsWith('data:image')) {
                                setLocalPreviewUrl(savedInput);
                            }
                        } else {
                            setInputText(savedInput);
                        }
                    }
                  }
              } else {
                toast({ variant: 'destructive', title: 'Project not found in your data.' });
                router.push('/');
              }
            } else {
              toast({ variant: 'destructive', title: 'User data not found.' });
              router.push('/');
            }
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error loading project' });
        } finally {
             setIsParsing(false);
        }
      };
      fetchProject();
    }
  }, [projectId, user, operation, toast, router]);

  const handleSaveProject = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to save projects.' });
      return;
    }
    if (!generatedText) {
      toast({ variant: 'destructive', title: 'Nothing to save', description: 'Please generate a result first.' });
      return;
    }
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const newProject = {
          id: `proj_${Date.now()}`, // Simple unique ID
          inputText: fileDataUri || inputText,
          outputText: generatedText,
          operation: operation,
          createdAt: new Date().toISOString(),
      };
      
      await updateDoc(userDocRef, {
          projects: arrayUnion(newProject)
      });

      toast({title: "Project Saved!", description: "Your work has been saved to your profile."})
    } catch (error) {
      console.error("Error saving project: ", error);
      toast({ variant: 'destructive', title: 'Could not save project.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleParseFile = async (file: File) => {
    setIsParsing(true);
    setInputText("");
    setGeneratedText("");

    try {
        const fileType = file.type;
        const reader = new FileReader();

        reader.onerror = () => {
            reader.abort();
            throw new DOMException("Problem parsing input file.");
        };
        
        reader.onload = async (e) => {
            try {
                const buffer = e.target?.result;
                let textContent = "";
                if (fileType.startsWith("image/")) {
                    const dataUri = await fileToDataUri(file);
                    setFileDataUri(dataUri);
                    setLocalPreviewUrl(dataUri);
                } else {
                    const dataUri = await fileToDataUri(file);
                    setFileDataUri(dataUri);
                    if (fileType === 'application/pdf') {
                        const pdf = await pdfjsLib.getDocument(buffer as ArrayBuffer).promise;
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            textContent += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                        }
                    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        const result = await mammoth.extractRawText({ arrayBuffer: buffer as ArrayBuffer });
                        textContent = result.value;
                    }
                    setInputText(textContent);
                }
                setIsParsing(false);
            } catch (err) {
                throw err;
            }
        };
        
        if (fileType.startsWith("image/")) {
            reader.readAsDataURL(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    } catch (err) {
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not parse the selected file.' });
        setFileName(null);
        setIsParsing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleParseFile(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      handleParseFile(file);
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim() && !fileDataUri) {
        toast({
            variant: 'destructive',
            title: 'No Input Provided',
            description: 'Please enter text or upload a file.',
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
    
    startLoading();
    try {
        const isImage = fileDataUri?.startsWith("data:image");
        const payload = {
            operation,
            ...(isImage ? { fileUrl: fileDataUri! } : { text: inputText! }),
            ...(operation === 'translate' ? { targetLanguage } : {}),
            ...(operation === 'style' ? { targetStyle: finalStyle } : {}),
        };

        const result = await processImageText(payload);

        if (result && result.processedText) {
        setGeneratedText(result.processedText);
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
    } finally {
        stopLoading();
    }
  };

  const handleCopy = (textToCopy: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard!",
      description: "The result has been copied.",
    });
  };

  const handleDownloadPdf = async (textToDownload: string, fileName: string) => {
    if (!textToDownload) return;
    
    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const margin = 50;
      let y = height - margin;

       const drawTextWithWrapping = (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; }) => {
            const { font, size, color, lineHeight, x, maxWidth } = options;
            const lines = text.split('\n');
            for (const line of lines) {
                let words = line.split(' ');
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
            }
        };
      
      drawTextWithWrapping(textToDownload, {
          font: helveticaFont, size: 12, color: rgb(0.2, 0.2, 0.2), lineHeight: 15, x: margin, maxWidth: width - 2 * margin,
      });

      const pages = pdfDoc.getPages();
      const watermarkText = "Researched and created with Vesper";
      for (const pdfPage of pages) {
        const { width, height } = pdfPage.getSize();
        pdfPage.drawText(watermarkText, {
            x: width / 2 - helveticaFont.widthOfTextAtSize(watermarkText, 50) / 2,
            y: height / 2,
            font: helveticaFont,
            size: 50,
            color: rgb(0.1, 0.1, 0.1),
            opacity: 0.1,
            rotate: degrees(-30),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
          title: "PDF Downloaded",
          description: "Your result has been saved as a PDF.",
      });
    } catch(err) {
      console.error("Failed to generate PDF", err);
      toast({
          variant: "destructive",
          title: "PDF Download Failed",
          description: "Could not create PDF from the result.",
      });
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'email', text: string) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(appUrl);
    const title = `Result from Vesper - ${operation}`;

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

  const handleAddToWorkspace = () => {
    if (!generatedText) return;
    const finalStyle = customStyle.trim() || targetStyle;
    addWorkspaceStep({
        id: Date.now(),
        operation: operation,
        text: generatedText,
        options: operation === 'translate' ? { lang: targetLanguage } : operation === 'style' ? { style: finalStyle } : undefined
    });
    router.push('/workspace');
    toast({title: "Added to Workspace!", description: "The result has been added as a new step in your workspace."});
  };

  const buttonText = {
      paraphrase: 'Paraphrase',
      summarize: 'Summarize',
      translate: 'Translate',
      style: 'Apply Style',
      grammar: 'Check Grammar',
  }[operation as 'paraphrase' | 'summarize' | 'translate' | 'style' | 'grammar'];

  const buttonTextPending = {
      paraphrase: 'Paraphrasing...',
      summarize: 'Summarizing...',
      translate: 'Translating...',
      style: 'Applying Style...',
      grammar: 'Checking...',
  }[operation as 'paraphrase' | 'summarize' | 'translate' | 'style' | 'grammar'];

  const finalStyle = customStyle.trim() || targetStyle;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label htmlFor={`image-upload-${operation}`} className="font-semibold text-md">
          Upload a File or Enter Text
        </Label>
        
        <label
            htmlFor={`image-upload-${operation}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            className={cn(
                "group relative flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                isDragging
                    ? "border-primary bg-primary/20"
                    : "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground"
            )}
        >
          <input
              type="file"
              id={`image-upload-${operation}`}
              ref={fileInputRef}
              onChange={handleFileChange}
              className="sr-only"
              accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
            {localPreviewUrl ? (
                <div className="relative w-full h-full p-2 min-h-[10rem]">
                    <Image
                    src={localPreviewUrl}
                    alt="Uploaded content"
                    fill
                    className="rounded-lg object-contain"
                    />
                </div>
            ) : fileName ? (
             <div className="flex flex-col items-center justify-center text-center p-4">
                <FileText className="w-12 h-12 mb-2 text-primary" />
                <p className="font-semibold text-foreground">{fileName}</p>
                {isParsing ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Parsing file...</span>
                    </div>
                ): (
                    <p className="text-sm text-muted-foreground mt-2">Ready to be processed</p>
                )}
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center p-4">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">Image, PDF, or DOCX files</p>
            </div>
            )}
        </label>
         <div className="relative">
             <Textarea
                  id={`input-text-${operation}`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Or enter text here..."
                  className="h-40 resize-y bg-background focus-visible:ring-accent pr-10"
                  disabled={isLoading}
                />
             {hasSupport && (
                <div className="absolute bottom-2 right-2">
                    <SpeechRecognitionButton isListening={isListening} onClick={toggleListening} />
                </div>
             )}
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
                        <SelectGroup>
                            <SelectLabel>General Tone</SelectLabel>
                            <SelectItem value="Formal">Formal</SelectItem>
                            <SelectItem value="Casual">Casual</SelectItem>
                            <SelectItem value="Confident">Confident</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>Genre</SelectLabel>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Creative">Creative</SelectItem>
                        </SelectGroup>
                         <SelectGroup>
                             <SelectLabel>Famous Authors</SelectLabel>
                            <SelectItem value="Poetic">Poetic</SelectItem>
                            <SelectItem value="Dramatic">Dramatic</SelectItem>
                        </SelectGroup>
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
                    Enter Custom Style or Author
                </Label>
                <Input 
                    id={`custom-style-input-${operation}`}
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="e.g., William Shakespeare, Scientific Journal"
                    className="bg-background/50 focus-visible:ring-accent"
                />
            </div>
          </div>
        )}

        <Label htmlFor={`output-text-${operation}`} className="font-semibold text-md">
          Result
        </Label>
        <div className="relative flex-grow min-h-[24rem]">
            {isParsing ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background/50 rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-semibold">Reading file...</p>
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
                    readOnly={isLoading}
                />
            )}
          
          {!isLoading && !isParsing && (
            <div className="absolute top-2 right-2 flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            disabled={!generatedText || isLoading}
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
                disabled={!generatedText || isLoading}
                aria-label="Copy to clipboard"
                >
                <Copy className="h-5 w-5" />
                </Button>
                <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleDownloadPdf(generatedText, `vesper-result-${operation}.pdf`)}
                disabled={!generatedText || isLoading}
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
                    onClick={() => {
                        setWorkspaceText(generatedText);
                        router.push('/tts');
                    }}
                    className="w-full sm:w-auto"
                >
                    <AudioLines className="mr-2 h-5 w-5" />
                    Listen with Text-to-Speech
                </Button>
                <Button 
                    onClick={handleAddToWorkspace} 
                    variant="outline"
                    className="w-full sm:w-auto"
                >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Add to Workspace
                </Button>
                <Button onClick={handleSaveProject} disabled={isSaving || !user} className="w-full sm:w-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Project
                </Button>
            </div>
          </div>
        )}
      </div>
      <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 py-4">
         <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={handleProcess}
            disabled={(!inputText.trim() && !fileDataUri) || isLoading || isParsing || (operation === 'translate' && !targetLanguage.trim()) || (operation === 'style' && !finalStyle)}
            size="lg"
            className={cn(
                "w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto",
                isLoading && "animate-sparkle"
            )}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            <span>{isLoading ? buttonTextPending : buttonText}</span>
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

    
