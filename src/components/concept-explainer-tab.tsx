
"use client";

import { useState, useTransition } from "react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { conceptExplainer, ConceptExplainerOutput } from "@/ai/flows/concept-explainer-flow";
import { cn } from "@/lib/utils";

const IconComponent = ({ name }: { name: string }) => {
    const Icon = (LucideIcons as any)[name];
    if (!Icon) {
        return <LucideIcons.HelpCircle className="h-10 w-10" />;
    }
    return <Icon className="h-10 w-10" />;
};

export function ConceptExplainerTab() {
  const [topic, setTopic] = useState<string>("");
  const [result, setResult] = useState<ConceptExplainerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [visibleStep, setVisibleStep] = useState<number>(-1);
  const { toast } = useToast();

  const handleExplain = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic is empty",
        description: "Please enter a topic to explain.",
        variant: "destructive",
      });
      return;
    }

    setError(null);
    setResult(null);
    setVisibleStep(-1);

    startTransition(async () => {
      try {
        const explainerResult = await conceptExplainer({ topic });
        setResult(explainerResult);
        // Start the animation sequence
        explainerResult.steps.forEach((_, index) => {
          setTimeout(() => {
            setVisibleStep(index);
          }, (index + 1) * 1000); 
        });
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to explain topic. ${errorMessage}`);
        toast({
          title: "Explanation Error",
          description: "An error occurred while generating the explanation. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <Label htmlFor="explainer-topic" className="text-xl font-bold tracking-tight">
          What complex topic can I simplify for you?
        </Label>
        <div className="flex w-full max-w-lg items-center space-x-2">
            <Input
                id="explainer-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Quantum Computing, Black Holes, Neural Networks"
                className="bg-background focus-visible:ring-accent text-base h-12"
                disabled={isPending}
                onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
            />
            <Button
                onClick={handleExplain}
                disabled={!topic.trim() || isPending}
                size="lg"
                className="h-12 text-lg font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
            >
            {isPending ? (
                <LucideIcons.Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <LucideIcons.Sparkles className="mr-2 h-5 w-5" />
            )}
            {isPending ? "Explaining..." : "Explain"}
            </Button>
        </div>
        {error && <p className="text-sm text-destructive text-center mt-4">{error}</p>}
      </div>

      <div className="relative w-full min-h-[500px] bg-muted/30 rounded-2xl p-8 overflow-hidden">
        {isPending && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in fade-in duration-500">
            <LucideIcons.Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="font-semibold text-lg">Thinking...</p>
          </div>
        )}
        {!isPending && !result && (
          <div className="text-center text-muted-foreground p-4 flex flex-col items-center justify-center h-full">
            <LucideIcons.BrainCircuit className="h-24 w-24 text-primary/30 mb-4" />
            <p className="text-lg">Your simplified explanation will appear here.</p>
          </div>
        )}
        {result && (
            <div className="text-center animate-in fade-in-0 slide-in-from-top-10 duration-700">
                <h2 className="text-4xl font-extrabold tracking-tight text-primary">{result.title}</h2>
                <p className="mt-2 text-lg text-muted-foreground">{result.introduction}</p>
                <div 
                    className={cn(
                        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 transition-all duration-1000 ease-out",
                        visibleStep >= 0 ? "opacity-100" : "opacity-0 -translate-y-4"
                    )}
                >
                    {result.steps.map((step, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex flex-col items-center p-6 bg-card rounded-xl shadow-lg border border-border/50 transition-all duration-700 ease-out",
                                index <= visibleStep 
                                    ? "opacity-100 translate-y-0 scale-100"
                                    : "opacity-0 translate-y-10 scale-90"
                            )}
                        >
                            <div className="p-3 bg-primary/10 text-primary rounded-full mb-4">
                               <IconComponent name={step.icon} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.explanation}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
