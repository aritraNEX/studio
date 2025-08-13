
"use client";

import { useState, useEffect } from 'react';
import { Progress } from './ui/progress';

const steps = [
    { text: "Analyzing Input...", duration: 1000, progress: 25 },
    { text: "Contacting AI...", duration: 1500, progress: 50 },
    { text: "Generating Response...", duration: 2000, progress: 75 },
    { text: "Finalizing Result...", duration: 1000, progress: 100 },
];

export function InProgressLoader() {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (currentStep < steps.length - 1) {
            const timer = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, steps[currentStep].duration);
            return () => clearTimeout(timer);
        }
    }, [currentStep]);

    const currentProgress = steps[currentStep].progress;

    return (
        <div className="flex flex-col items-center justify-center gap-6 text-muted-foreground animate-in fade-in duration-500 w-full max-w-md mx-auto">
            <div className="preloader-spin"></div>
            <div className="w-full text-center">
                <p className="font-semibold text-lg text-foreground mb-2">{steps[currentStep].text}</p>
                <Progress value={currentProgress} className="h-2" />
            </div>
        </div>
    );
}
