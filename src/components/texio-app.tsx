"use client";

import { Sparkles, Quote, BookText, Languages, Notebook, Palette } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OperationTab } from "./operation-tab";
import { AdBanner } from "./ad-banner";
import { NotepadTab } from "./notepad-tab";

export function TexioApp() {
  return (
    <Card className="w-full max-w-5xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-xl p-3 w-fit mb-4 shadow-lg shadow-primary/30">
          <Sparkles className="h-8 w-8" />
        </div>
        <CardTitle className="text-4xl font-bold tracking-tight">Tex.io</CardTitle>
        <CardDescription className="text-lg text-muted-foreground/80">
          Upload an image to magically paraphrase, summarize, or translate its text.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-8 pt-2">
        <Tabs defaultValue="paraphrase" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5 mx-auto max-w-2xl h-auto p-1.5">
            <TabsTrigger value="paraphrase" className="py-2.5">
                <Quote className="h-5 w-5 mr-2" />
                <span>Paraphrase</span>
            </TabsTrigger>
            <TabsTrigger value="summarize" className="py-2.5">
                <BookText className="h-5 w-5 mr-2" />
                <span>Summarize</span>
            </TabsTrigger>
            <TabsTrigger value="translate" className="py-2.5">
                <Languages className="h-5 w-5 mr-2" />
                <span>Translate</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="py-2.5">
                <Palette className="h-5 w-5 mr-2" />
                <span>Style</span>
            </TabsTrigger>
            <TabsTrigger value="notepad" className="py-2.5">
                <Notebook className="h-5 w-5 mr-2" />
                <span>Notepad</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="paraphrase" className="pt-6">
            <OperationTab operation="paraphrase" />
          </TabsContent>
          <TabsContent value="summarize" className="pt-6">
            <OperationTab operation="summarize" />
          </TabsContent>
          <TabsContent value="translate" className="pt-6">
            <OperationTab operation="translate" />
          </TabsContent>
          <TabsContent value="style" className="pt-6">
            <OperationTab operation="style" />
          </TabsContent>
          <TabsContent value="notepad" className="pt-6">
            <NotepadTab />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex-col gap-4 px-4 sm:px-8 pb-4">
        <AdBanner adClient="ca-pub-1743205890050653" adSlot="7457666036" />
        <AdBanner adClient="ca-pub-1743205890050653" adSlot="7457666036" />
      </CardFooter>
    </Card>
  );
}
