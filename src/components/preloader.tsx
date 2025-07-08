"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Quote, BookText, Languages, FileText, ScanText, ClipboardCopy, Type, Wand2, ArrowRightLeft, MessageSquareQuote, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

const icons = [
  Sparkles, Quote, BookText, Languages, FileText, ScanText, 
  ClipboardCopy, Type, Wand2, ArrowRightLeft, MessageSquareQuote, Pencil
];

const AnimatedIcon = ({ index }: { index: number }) => {
    const Icon = icons[index % icons.length];
    const animationDuration = 8 + Math.random() * 7; // 8s to 15s
    const animationDelay = Math.random() * 10; // 0s to 10s
    const size = 16 + Math.random() * 32; // 16px to 48px
    const leftPosition = Math.random() * 100;

    return (
        <div 
            className="absolute bottom-0 animate-float-up"
            style={{ 
                left: `${leftPosition}%`,
                animationDuration: `${animationDuration}s`,
                animationDelay: `${animationDelay}s`,
            }}
        >
            <Icon 
                className="text-muted-foreground/70"
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
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
      setTimeout(onAnimationComplete, 1000); 
    }, 3000);

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
