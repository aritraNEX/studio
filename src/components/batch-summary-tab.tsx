
"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { Copy, Loader2, Sparkles, Upload, Download, File as FileIcon, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { processImageText } from "@/ai/flows/paraphrase-image-text";
import { cn } from "@/lib/utils";
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";

type FileStatus = 'pending' | 'parsing' | 'ready' | 'processing' | 'done' | 'error';

interface ProcessedFile {
    id: string;
    file: File;
    status: FileStatus;
    extractedText?: string;
    generatedText?: string;
    error?: string;
}

export function BatchSummaryTab() {
    const [files, setFiles] = useState<ProcessedFile[]>([]);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
    }, []);

    const parseFile = async (fileToParse: ProcessedFile): Promise<{ text?: string, dataUri?: string }> => {
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
                    const buffer = e.target?.result;
                    if (fileType.startsWith("image/")) {
                       resolve({ dataUri: buffer as string });
                    } else if (fileType === 'application/pdf') {
                        const pdf = await pdfjsLib.getDocument(buffer as ArrayBuffer).promise;
                        let text = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
                        }
                        resolve({ text });
                    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        const result = await mammoth.extractRawText({ arrayBuffer: buffer as ArrayBuffer });
                        resolve({ text: result.value });
                    }
                } catch (err) {
                    reject(err);
                }
            };

            if (fileType.startsWith("image/")) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    };

    const handleFileUpload = (file: File) => {
        if (!file) return;
        const newFile: ProcessedFile = { id: `${file.name}-${Date.now()}`, file, status: 'pending' };
        setFiles(prev => [...prev, newFile]);
        handleFileParsing(newFile);
    };

    const handleFileParsing = async (fileToParse: ProcessedFile) => {
        setIsParsing(true);
        setFiles(prev => prev.map(f => f.id === fileToParse.id ? { ...f, status: 'parsing' } : f));
        try {
            const { text, dataUri } = await parseFile(fileToParse);
            setFiles(prev => prev.map(f => f.id === fileToParse.id ? { ...f, extractedText: text || dataUri, status: 'ready' } : f));
        } catch (error) {
            console.error("Failed to parse file", error);
            setFiles(prev => prev.map(f => f.id === fileToParse.id ? { ...f, status: 'error', error: 'Failed to parse' } : f));
            toast({ variant: 'destructive', title: `Could not read file: ${fileToParse.file.name}` });
        } finally {
            setIsParsing(false);
        }
    };
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles) {
            Array.from(selectedFiles).forEach(file => handleFileUpload(file));
        }
         // Reset file input to allow uploading the same file again
        if(event.target) {
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
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles) {
            Array.from(droppedFiles).forEach(file => handleFileUpload(file));
        }
    };

    const handleRemoveFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleBatchProcess = async () => {
        setIsBatchProcessing(true);
        const processingPromises = files
            .filter(file => file.status === 'ready')
            .map(async (file) => {
                setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f));
                try {
                    const isImage = file.file.type.startsWith("image/");
                    const inputPayload = {
                        operation: 'summarize' as const,
                        ...(isImage ? { fileUrl: file.extractedText! } : { text: file.extractedText! })
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
            });
        
        await Promise.all(processingPromises);
        setIsBatchProcessing(false);
    };
    
    const handleDownloadAll = async () => {
        try {
            const pdfDoc = await PDFDocument.create();
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            let page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const margin = 50;
            let y = height - margin;

            const drawTextWithWrapping = (text: string, options: { font: any; size: number; color: any; lineHeight: number; x: number; maxWidth: number; }) => {
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
            
            for (const file of files) {
                if (file.status === 'done' && file.generatedText) {
                    if (y < margin + 60) {
                        page = pdfDoc.addPage();
                        y = height - margin;
                    }
                    
                    drawTextWithWrapping(`Summary for: ${file.file.name}`, {
                        font: helveticaBoldFont, size: 14, color: rgb(0, 0, 0), lineHeight: 18, x: margin, maxWidth: width - 2 * margin
                    });
                    y -= 20;

                    const lines = file.generatedText.split('\n');
                    for (const line of lines) {
                        drawTextWithWrapping(line, {
                           font: helveticaFont, size: 10, color: rgb(0.2, 0.2, 0.2), lineHeight: 14, x: margin, maxWidth: width - 2 * margin
                        });
                        if (line.trim() === '') y -= 7; // Add small space for paragraphs
                    }
                    y -= 20; // Extra space between summaries
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
            link.download = "vesper-summaries.pdf";
            link.click();
            URL.revokeObjectURL(link.href);

            toast({
                title: "PDF Downloaded",
                description: "All summaries have been saved as a single PDF.",
            });
        } catch (pdfError) {
            console.error("PDF generation failed:", pdfError);
            toast({ variant: 'destructive', title: 'PDF Download Failed' });
        }
    };
    
    const handleCopy = (textToCopy: string) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        toast({
        title: "Copied to clipboard!",
        description: "The summary has been copied.",
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
            
            const lines = textToDownload.split('\n');
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
            link.download = `vesper-summary-${fileName}.pdf`;
            link.click();
            URL.revokeObjectURL(link.href);

            toast({
                title: "PDF Downloaded",
                description: "The summary has been saved as a PDF.",
            });
        } catch (pdfError) {
            console.error("PDF generation failed:", pdfError);
            toast({ variant: 'destructive', title: 'PDF Download Failed' });
        }
    };

    const readyFilesCount = files.filter(f => f.status === 'ready').length;
    const doneFilesCount = files.filter(f => f.status === 'done').length;
    const progress = files.length > 0 ? ((files.filter(f => f.status === 'done' || f.status === 'error').length) / files.length) * 100 : 0;
    
    return (
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-4">
                 <Label htmlFor="batch-upload" className="font-semibold text-md">
                    Upload Files for Batch Summary
                </Label>
                <input
                    type="file"
                    id="batch-upload"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="sr-only"
                    accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    disabled={isBatchProcessing || isParsing}
                />
                 <label
                    htmlFor="batch-upload"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    className={cn(
                        "group flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                        isDragging 
                            ? "border-primary bg-primary/20"
                            : "border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 text-muted-foreground",
                        (isBatchProcessing || isParsing) && "cursor-not-allowed opacity-60"
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
                                        <p className="text-xs text-muted-foreground capitalize">{f.error || f.status}</p>
                                    </div>
                                    {f.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {f.status === 'done' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => handleRemoveFile(f.id)} disabled={isBatchProcessing || isParsing}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex flex-col gap-4 h-full">
                <Label className="font-semibold text-md">
                    Summaries
                </Label>
                <div className="relative flex-grow min-h-[24rem]">
                    {doneFilesCount > 0 ? (
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
                                                    onClick={() => handleDownloadPdf(file.generatedText!, file.file.name)}
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
                             {isBatchProcessing && <p>Processing files...</p>}
                             {!isBatchProcessing && isParsing && <p>Parsing files...</p>}
                             {!isBatchProcessing && !isParsing && files.length === 0 && <p>Upload files to begin.</p>}
                             {!isBatchProcessing && !isParsing && files.length > 0 && doneFilesCount === 0 && <p>Ready to process. Click "Summarize All".</p>}
                        </div>
                    )}
                </div>
            </div>

             <div className="md:col-span-2 flex flex-col items-center justify-center gap-4 py-4">
                {files.length > 0 && (
                    <div className="w-full max-w-md animate-in fade-in duration-300">
                        <div className="flex justify-between mb-1">
                             <span className="text-sm font-medium text-muted-foreground">Processing Progress</span>
                             <span className="text-sm font-medium">{files.filter(f => f.status === 'done' || f.status === 'error').length} / {files.length} done</span>
                        </div>
                        <Progress value={progress} className="w-full h-2" />
                    </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                    <Button
                        onClick={handleBatchProcess}
                        disabled={readyFilesCount === 0 || isBatchProcessing || isParsing}
                        size="lg"
                        className="w-full max-w-xs text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95 sm:w-auto"
                    >
                        {isBatchProcessing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-5 w-5" />
                        )}
                        {isBatchProcessing ? "Summarizing..." : `Summarize All (${readyFilesCount})`}
                    </Button>
                    {doneFilesCount > 0 && (
                        <Button
                            onClick={handleDownloadAll}
                            variant="outline"
                            size="lg"
                            className="w-full max-w-xs text-lg font-semibold transition-all duration-300 hover:scale-105 sm:w-auto"
                            disabled={isBatchProcessing || isParsing}
                        >
                            <Download className="mr-2 h-5 w-5" />
                            Download All ({doneFilesCount})
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
