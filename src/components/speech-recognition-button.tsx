
"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SpeechRecognitionButtonProps {
    isListening: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export function SpeechRecognitionButton({ isListening, onClick, disabled }: SpeechRecognitionButtonProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-8 w-8 rounded-full text-muted-foreground transition-all duration-300",
                isListening && "text-primary scale-110 bg-primary/20",
                isListening && "animate-pulse"
            )}
            aria-label={isListening ? "Stop listening" : "Start listening"}
        >
            {isListening ? (
                 <div className="relative h-5 w-5">
                    <Mic className="h-5 w-5" />
                </div>
            ) : (
                <Mic className="h-5 w-5" />
            )}
        </Button>
    );
}
