
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle, Crown } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const premiumFeatures = [
    "Concept Explainer & Diagram Generator",
    "Grammar Checker & Plagiarism Detection",
    "Flashcard & Citation Generation",
    "Advanced AI Tools like Assign-mentor",
    "Batch File Processing & Video Transcription",
    "Collaborative Workspace & Research Assistant",
    "All Future Premium Features",
];

export function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const handleSubscribe = () => {
    // This is where you would redirect to your Stripe checkout page
    console.log("Redirecting to Stripe...");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="text-center items-center">
          <div className="bg-yellow-400/20 text-yellow-500 rounded-full p-3 w-fit mb-4 border border-yellow-500/30">
            <Crown className="h-8 w-8" />
          </div>
          <DialogTitle className="text-3xl font-bold">Go Premium</DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            Unlock all features and supercharge your productivity.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow">
            <div className="py-6 pr-6">
                <ul className="space-y-3">
                    {premiumFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </ScrollArea>
        <DialogFooter className="flex-col gap-2 mt-auto">
            <p className="text-center text-muted-foreground text-sm">
                Get unlimited access to everything for just
            </p>
            <Button size="lg" className="w-full text-lg font-bold" onClick={handleSubscribe}>
                Upgrade Now for $1.50/month
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
