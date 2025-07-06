"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Copy, Loader2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { paraphraseImageText } from "@/ai/flows/paraphrase-image-text";
import { cn } from "@/lib/utils";

export function TexioApp() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  const handleParaphrase = () => {
    if (!imageDataUrl) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await paraphraseImageText({ photoDataUri: imageDataUrl });
        if (result && result.paraphrasedText) {
          setGeneratedText(result.paraphrasedText);
        } else {
          throw new Error("The paraphrased text is empty.");
        }
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to paraphrase text. Please try again.`);
        toast({
          title: "Paraphrasing Error",
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
      description: "The paraphrased text has been copied.",
    });
  };

  return (
    <Card className="w-full max-w-4xl shadow-2xl shadow-primary/10">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary text-primary-foreground rounded-lg p-3 w-fit mb-4">
          <Wand2 className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">Tex.io</CardTitle>
        <CardDescription className="text-lg">
          Upload an image to magically paraphrase its text.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          <Label htmlFor="image-upload" className="font-semibold text-md">
            Upload Image
          </Label>
          <div className="relative">
            <input
              type="file"
              id="image-upload"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="sr-only"
              accept="image/*"
            />
            <label
              htmlFor="image-upload"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                "border-border hover:border-primary/50 bg-background hover:bg-muted"
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
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">Any common image format</p>
                </div>
              )}
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Label htmlFor="output-text" className="font-semibold text-md">
            Paraphrased Text
          </Label>
          <div className="relative">
            <Textarea
              id="output-text"
              readOnly
              value={generatedText}
              placeholder={isPending ? "Generating your text..." : "Your paraphrased text will appear here..."}
              className="h-64 resize-none pr-12 animate-in fade-in duration-500"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              disabled={!generatedText || isPending}
              aria-label="Copy to clipboard"
            >
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center gap-4 pt-4">
        <Button
          onClick={handleParaphrase}
          disabled={!imageDataUrl || isPending}
          size="lg"
          className="w-full max-w-xs text-lg"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-5 w-5" />
          )}
          {isPending ? "Paraphrasing..." : "Paraphrase"}
        </Button>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
      </CardFooter>
    </Card>
  );
}
