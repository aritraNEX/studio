
"use client";

import { useState, useTransition, useRef } from "react";
import Latex from "react-latex-next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { imageToLatex } from "@/ai/flows/image-to-latex-flow";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { InProgressLoader } from "./in-progress-loader";

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export function FormulaTab() {
  const [latexInput, setLatexInput] = useState("$$E = mc^2$$");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLatexChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLatexInput(e.target.value);
    setError(null);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
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
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid File", description: "Please upload an image file." });
      return;
    }
    
    setError(null);
    const imageUrl = await fileToDataUri(file);
    setPreviewUrl(imageUrl);
    
    startTransition(async () => {
        try {
            const result = await imageToLatex({ imageUrl });
            if (result.latex) {
                setLatexInput(result.latex);
            } else {
                throw new Error("Could not extract formula from image.");
            }
        } catch (e: any) {
            toast({ variant: "destructive", title: "Extraction Failed", description: e.message });
            setError("Could not read formula from the uploaded image.");
        }
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-4">
        <Label className="font-semibold text-md">
          Enter LaTeX or Upload an Image
        </Label>
        <Textarea
          id="latex-input"
          value={latexInput}
          onChange={handleLatexChange}
          placeholder="Type your LaTeX code here, e.g., $$ \frac{\pi}{2} $$"
          className="h-48 resize-y bg-background focus-visible:ring-accent font-mono"
        />
        <div className="relative flex items-center justify-center">
            <div className="flex-grow border-t border-muted-foreground/20"></div>
            <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground">Or</span>
            <div className="flex-grow border-t border-muted-foreground/20"></div>
        </div>
        <label
            htmlFor="formula-upload"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
            className={cn(
                "group relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                isDragging ? "border-primary bg-primary/20" : "border-border hover:border-primary"
            )}
        >
          <input
            type="file"
            id="formula-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
            accept="image/*"
            disabled={isPending}
          />
          {previewUrl && !isPending && (
             <Image src={previewUrl} alt="Formula preview" fill className="object-contain rounded-lg p-2" />
          )}
          {isPending && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <InProgressLoader />
            </div>
          )}
          {!previewUrl && !isPending && (
            <div className="flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                <Upload className="w-10 h-10 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary" />
                <p className="mb-2 text-sm">
                    <span className="font-semibold text-primary">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs">an image of a formula</p>
            </div>
          )}
        </label>
      </div>
      <div className="flex flex-col gap-4">
        <Label className="font-semibold text-md">Live Preview</Label>
        <Card className="min-h-96 bg-background/50 flex flex-col items-center justify-center">
          <CardContent className="flex-grow flex items-center justify-center p-6 w-full overflow-auto">
            <div className="text-2xl text-foreground w-full text-center">
              <Latex
                delimiters={[
                  { left: "$$", right: "$$", display: true },
                  { left: "$", right: "$", display: false },
                  { left: "\\[", right: "\\]", display: true },
                  { left: "\\(", right: "\\)", display: false },
                ]}
                strict={(errorCode, errorMsg) => {
                  setTimeout(() => setError(`[${errorCode}] ${errorMsg}`), 0);
                  return 'ignore';
                }}
              >
                {latexInput}
              </Latex>
            </div>
          </CardContent>
        </Card>
        {error && !isPending && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>LaTeX Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </div>
    </div>
  );
}
