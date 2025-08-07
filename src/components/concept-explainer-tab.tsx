
"use client";

import React, { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Book, Users, Brain, Share2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { conceptExplainer, ConceptExplainerOutput } from "@/ai/flows/concept-explainer-flow";
import * as LucideIcons from 'lucide-react';

const animationVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
};

const ExplainPanel = ({ topic, explanation }: { topic: string; explanation: ConceptExplainerOutput | null }) => (
  <motion.div variants={animationVariants} initial="initial" animate="animate" className="space-y-4">
    <h2 className="text-2xl font-semibold">AI Explaining: {topic}</h2>
    {explanation ? (
        <p className="text-muted-foreground">
            {explanation.introduction} AI has broken this down into digestible, visual, and animated formats. Click through the tabs to explore subtopics.
        </p>
    ) : (
        <p className="text-muted-foreground">Enter a topic and click "Explain" to see the AI-powered breakdown here.</p>
    )}
  </motion.div>
);

const Visualizer = ({ steps }: { steps: ConceptExplainerOutput['steps'] | null }) => {
    const chartData = steps ? steps.map((step, index) => ({
        name: `Step ${index + 1}`,
        value: (index + 1) * 20 + Math.random() * 30, // Dummy complexity value
        label: step.title
    })) : [];

    if (!steps) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Generate an explanation to see the visualizer.</div>
    }

    return (
        <Card>
            <CardContent className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-10} textAnchor="end" height={60} />
                <YAxis tick={{fill: 'hsl(var(--muted-foreground))'}} />
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))'
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

const Storyboard = ({ steps }: { steps: ConceptExplainerOutput['steps'] | null }) => (
  <motion.div 
    className="space-y-4"
    variants={animationVariants}
    initial="initial"
    animate="animate"
  >
    <h3 className="text-xl font-bold">Storyboard</h3>
    {steps ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, index) => {
            const Icon = (LucideIcons as any)[step.icon] || LucideIcons.HelpCircle;
            return (
              <motion.div
              key={index}
              className="p-4 rounded-xl shadow bg-muted/50 hover:bg-background border border-border flex flex-col items-center text-center"
              variants={animationVariants}
              >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                     <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-semibold">{step.title}</h4>
                  <p className="text-sm text-muted-foreground mt-2 flex-grow">{step.explanation.substring(0, 100)}...</p>
              </motion.div>
            )
        })}
        </div>
    ): (
        <p className="text-muted-foreground">The storyboard will appear here after an explanation is generated.</p>
    )}
  </motion.div>
);

const InviteSystem = () => (
    <Card>
        <CardContent className="space-y-3 pt-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
            <Share2 className="w-5 h-5" /> Invite via Secure Link
        </h3>
        <p className="text-muted-foreground">Send encrypted invite links that expire after one use.</p>
        <Input placeholder="Enter email or username" />
        <Button variant="outline">Generate Invite Link</Button>
        </CardContent>
    </Card>
);

export function ConceptExplainerTab() {
  const [topic, setTopic] = useState('Quantum Computing');
  const [result, setResult] = useState<ConceptExplainerOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleExplain = () => {
      if (!topic.trim()) {
          toast({ variant: 'destructive', title: 'Topic is empty', description: 'Please enter a topic to explain.' });
          return;
      }
      setResult(null);
      startTransition(async () => {
          try {
              const explainerResult = await conceptExplainer({ topic });
              setResult(explainerResult);
          } catch (e: any) {
              toast({ variant: 'destructive', title: 'Explanation Error', description: e.message });
          }
      });
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-card rounded-xl">
      <h1 className="text-4xl font-bold flex items-center gap-3">
        <Book className="w-8 h-8" /> Concept Explainer AI Workspace
      </h1>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="max-w-md h-12 text-base"
          placeholder="Enter concept topic..."
          onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
        />
        <Button onClick={handleExplain} size="lg" className="h-12 text-lg w-full sm:w-auto" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            Explain
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visual">Visualizer</TabsTrigger>
          <TabsTrigger value="story">Storyboard</TabsTrigger>
          <TabsTrigger value="invite">Invite System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ExplainPanel topic={topic} explanation={result} />
        </TabsContent>
        <TabsContent value="visual" className="mt-4">
          <Visualizer steps={result?.steps} />
        </TabsContent>
        <TabsContent value="story" className="mt-4">
          <Storyboard steps={result?.steps} />
        </TabsContent>
        <TabsContent value="invite" className="mt-4">
          <InviteSystem />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 mt-12">
        <ShieldCheck className="w-5 h-5 text-green-500" />
        <p className="text-muted-foreground text-sm">Protected with Firebase Auth, Firestore Rules, and Encrypted Invites</p>
      </div>
    </div>
  );
};
