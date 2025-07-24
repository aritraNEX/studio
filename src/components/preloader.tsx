
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const Preloader = ({ onAnimationComplete }: { onAnimationComplete: () => void }) => {
  const [show, setShow] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

  useEffect(() => {
    // Set a timer for the minimum display duration of the animation.
    const minTimeTimer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 1500); // Adjusted time

    // Listen for the event that signals the app's content is ready.
    const hidePreloader = () => setAppIsReady(true);
    window.addEventListener('app-ready', hidePreloader);

    return () => {
      clearTimeout(minTimeTimer);
      window.removeEventListener('app-ready', hidePreloader);
    };
  }, []);

  useEffect(() => {
    // The preloader should only be hidden when both conditions are met:
    // 1. The app content is loaded (appIsReady).
    // 2. The minimum animation time has passed (minimumTimeElapsed).
    if (appIsReady && minimumTimeElapsed) {
      setShow(false);
    }
  }, [appIsReady, minimumTimeElapsed]);
  
  useEffect(() => {
    // This effect handles the final fade-out animation of the component.
    if (!show) {
        const fadeOutTimer = setTimeout(() => {
            onAnimationComplete();
        }, 500); // Match duration of opacity transition
        return () => clearTimeout(fadeOutTimer);
    }
  }, [show, onAnimationComplete]);


  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="z-10 text-center animate-in fade-in duration-1000">
          <div className="mx-auto w-fit mb-4">
             <svg
                width="48"
                height="48"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
              >
                <circle cx="40" cy="40" r="30" className="fill-primary" />
                <circle cx="70" cy="35" r="20" className="fill-primary/70" />
                <circle cx="65" cy="75" r="25" className="fill-accent" />
                <circle cx="80" cy="70" r="10" className="fill-primary" />
              </svg>
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground">Vesper</h1>
            <p className="mt-2 text-lg text-muted-foreground">Preparing the magic...</p>
          </div>
      </div>
    </div>
  );
};

export default Preloader;
