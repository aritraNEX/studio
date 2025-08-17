"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const messages = [
    "Setting up your interface...",
    "Analyzing Data Streams...",
    "Decrypting Response Matrix...",
    "Optimizing Neural Pathways...",
    "Vesper Ready for Commands."
];

const Preloader = ({ onAnimationComplete }: { onAnimationComplete: () => void }) => {
  const [show, setShow] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  const [text, setText] = useState(messages[0]);
  const [animationClass, setAnimationClass] = useState('animate-[typing_2s_steps(20)_forwards,blink_0.8s_step-end_infinite_alternate]');
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a timer for the minimum display duration of the animation.
    const minTimeTimer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 4500); // 3 cycles of messages

    // Listen for the event that signals the app's content is ready.
    const hidePreloader = () => setAppIsReady(true);
    window.addEventListener('app-ready', hidePreloader);

    intervalRef.current = setInterval(() => {
        indexRef.current = (indexRef.current + 1) % messages.length;
        setAnimationClass(''); // Reset animation
        setTimeout(() => {
            setText(messages[indexRef.current]);
            setAnimationClass('animate-[typing_2s_steps(20)_forwards,blink_0.8s_step-end_infinite_alternate]');
        }, 50);
    }, 3000);

    return () => {
      clearTimeout(minTimeTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
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
        if (intervalRef.current) clearInterval(intervalRef.current);
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
        <div className="preloader-spin"></div>
        <div className="mt-5 w-fit">
            <div className={cn('preloader-typing-text', animationClass)}>
                {text}
            </div>
        </div>
    </div>
  );
};

export default Preloader;
