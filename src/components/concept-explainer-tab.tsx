
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Book, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { conceptExplainer, ConceptExplainerOutput } from "@/ai/flows/concept-explainer-flow";
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLoading } from '@/contexts/loading-context';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { SpeechRecognitionButton } from './speech-recognition-button';
import { InProgressLoader } from './in-progress-loader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const ExplainPanel = ({ explanation }: { explanation: ConceptExplainerOutput | null }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
    {explanation ? (
        <>
            <motion.h2 variants={itemVariants} className="text-3xl font-bold tracking-tight">{explanation.title}</motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-muted-foreground">
                {explanation.introduction}
            </motion.p>
        </>
    ) : (
        <motion.p variants={itemVariants} className="text-muted-foreground">Enter a topic and click "Explain" to see the AI-powered breakdown here.</motion.p>
    )}
  </motion.div>
);

const Storyboard = ({ steps }: { steps: ConceptExplainerOutput['steps'] | null }) => (
  <motion.div
    className="space-y-4"
    variants={containerVariants}
    initial="hidden"
    animate="visible"
  >
    {steps ? (
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, index) => {
            const Icon = (LucideIcons as any)[step.icon] || LucideIcons.HelpCircle;
            return (
              <motion.div
                key={index}
                className="p-6 rounded-xl shadow-lg bg-card border flex flex-col"
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -8, shadow: "0px 15px 30px -5px rgba(0,0,0,0.1)" }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                     <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{step.explanation}</p>
              </motion.div>
            )
        })}
        </motion.div>
    ): (
        <motion.p variants={itemVariants} className="text-muted-foreground text-center py-10">The storyboard will appear here after an explanation is generated.</motion.p>
    )}
  </motion.div>
);

export function ConceptExplainerTab() {
  const [topic, setTopic] = useState('Quantum Computing');
  const [result, setResult] = useState<ConceptExplainerOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  const { isListening, toggleListening, hasSupport } = useSpeechRecognition({
      onTranscript: (transcript) => {
        setTopic(transcript);
      }
  });

  const handleExplain = async () => {
      if (!topic.trim()) {
          toast({ variant: 'destructive', title: 'Topic is empty', description: 'Please enter a topic to explain.' });
          return;
      }
      setResult(null);
      startTransition(async () => {
        try {
            const explainerResult = await conceptExplainer({ topic });
            setResult(explainerResult);
            setShowIntroVideo(true);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Explanation Error', description: e.message });
        }
      });
  }
  
  const handleVideoEnd = () => {
    setShowIntroVideo(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
        {showIntroVideo && (
            <div className="fixed inset-0 z-[100] bg-black">
                 <video
                    key="intro-video"
                    onEnded={handleVideoEnd}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover animate-in fade-in duration-500"
                >
                    <source src="https://cdn.pixabay.com/video/2024/02/09/198881-913725899.mp4" type="video/mp4" />
                    Your browser does not support HTML5 video.
                </video>
            </div>
        )}

        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
                <Book className="w-8 h-8" /> Concept Explainer
            </h1>
            <p className="text-lg text-muted-foreground mt-2">Let AI break down any complex topic for you.</p>
        </div>
      
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center max-w-xl mx-auto">
            <div className="relative w-full">
                <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="h-12 text-base flex-grow pr-12"
                    placeholder="Enter concept topic..."
                    onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                />
                {hasSupport && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <SpeechRecognitionButton isListening={isListening} onClick={toggleListening} />
                    </div>
                )}
            </div>
            <Button onClick={handleExplain} size="lg" className="h-12 text-lg w-full sm:w-auto" disabled={isPending || !topic.trim()}>
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                Explain
            </Button>
        </div>

      {isPending && !result && (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
            <InProgressLoader />
        </div>
      )}

      {!isPending && result && (
        <Tabs defaultValue="overview" className="w-full animate-in fade-in-50 duration-500">
            <div className="flex justify-center mb-4">
                <TabsList className="grid grid-cols-2 w-full max-w-sm">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="story">Storyboard</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="overview">
                <Card className="p-6">
                    <ExplainPanel explanation={result} />
                </Card>
            </TabsContent>
            <TabsContent value="story">
                <Storyboard steps={result.steps} />
            </TabsContent>
        </Tabs>
      )}

      {!isPending && !result && (
        <div className="text-center text-muted-foreground py-20">
            <p>Your explanation will appear here.</p>
        </div>
      )}

    </div>
  );
};
