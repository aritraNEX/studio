
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
    // We rely on the parent component's loading state to call onAnimationComplete.
    // This timeout is just for the fade-out animation itself.
    if (!show) {
        const timer = setTimeout(() => {
            onAnimationComplete();
        }, 700);
        return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete]);
  
  // Expose a function to the parent to hide the preloader
  useEffect(() => {
      const hidePreloader = () => setShow(false);
      window.addEventListener('app-ready', hidePreloader);
      return () => window.removeEventListener('app-ready', hidePreloader);
  }, []);


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
      <div className="z-10 text-center animate-logo-reveal">
          <div className="mx-auto w-fit mb-4">
             <svg
                width="48"
                height="48"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
              >
                <circle cx="40" cy="40" r="30" fill="#2E8B57" />
                <circle cx="70" cy="35" r="20" fill="#3CB371" />
                <circle cx="65" cy="75" r="25" fill="#20B2AA" />
                <circle cx="80" cy="70" r="10" fill="#2E8B57" />
              </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Tex.io</h1>
          <p className="mt-2 text-lg text-muted-foreground">Preparing the magic...</p>
      </div>
    </div>
  );
};

export default Preloader;
