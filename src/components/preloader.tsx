
"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Quote, BookText, Languages, FileText, ScanText, ClipboardCopy, Type, WandSparkles, ArrowRightLeft, MessageSquareQuote, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [
  Sparkles, Quote, BookText, Languages, FileText, ScanText, 
  ClipboardCopy, Type, WandSparkles, ArrowRightLeft, MessageSquareQuote, Pencil
];

const AnimatedIcon = ({ index }: { index: number }) => {
    const Icon = icons[index % icons.length];
    const [styleProps, setStyleProps] = useState<{
        left: string;
        animationDuration: string;
        animationDelay: string;
        size: string;
    } | null>(null);

    useEffect(() => {
        setStyleProps({
            left: `${Math.random() * 100}%`,
            animationDuration: `${8 + Math.random() * 7}s`,
            animationDelay: `${Math.random() * 10}s`,
            size: `${16 + Math.random() * 32}px`,
        });
    }, []); // Empty dependency array ensures this runs only on the client

    // Return null on the server and initial client render to prevent hydration mismatch
    if (!styleProps) {
        return null;
    }

    return (
        <div 
            className="absolute bottom-0 animate-float-up"
            style={{ 
                left: styleProps.left,
                animationDuration: styleProps.animationDuration,
                animationDelay: styleProps.animationDelay,
            }}
        >
            <Icon 
                className="text-muted-foreground/70"
                style={{
                    width: styleProps.size,
                    height: styleProps.size,
                }}
            />
        </div>
    );
};

const Preloader = ({ onAnimationComplete }: { onAnimationComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onAnimationComplete, 700); 
    }, 1500); // Reduced delay from 5000ms to 1500ms

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 overflow-hidden',
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="absolute inset-0 w-full h-full">
        {Array.from({ length: 25 }).map((_, index) => (
            <AnimatedIcon key={index} index={index} />
        ))}
      </div>
      <div className="z-10 text-center animate-in fade-in duration-1000 delay-500">
          <div className="mx-auto bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-xl p-3 w-fit mb-4 shadow-lg shadow-primary/30">
            <Sparkles className="h-10 w-10 animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Tex.io</h1>
          <p className="mt-2 text-lg text-muted-foreground">Preparing the magic...</p>
      </div>
    </div>
  );
};

export default Preloader;
