
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import allTools from '@/data/all-tools.json';
import { Card } from './ui/card';

const shuffleArray = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
};

export function ToolSuggestions() {
  const [suggestions, setSuggestions] = useState<typeof allTools>([]);
  const pathname = usePathname();

  const currentToolId = useMemo(() => pathname.split('/').pop(), [pathname]);

  useEffect(() => {
    const thirtyMinutes = 30 * 60 * 1000;
    
    const getSuggestions = () => {
      // Filter out the current tool
      const availableTools = allTools.filter(tool => tool.id !== currentToolId);
      // Shuffle the array to get a random order
      const shuffled = shuffleArray([...availableTools]);
      // Take the first 5
      return shuffled.slice(0, 5);
    };

    const lastUpdated = localStorage.getItem('toolSuggestionsLastUpdated');
    const storedSuggestions = localStorage.getItem('toolSuggestions');

    const now = new Date().getTime();

    if (lastUpdated && storedSuggestions && (now - parseInt(lastUpdated) < thirtyMinutes)) {
       try {
        const parsedSuggestions = JSON.parse(storedSuggestions);
        // Ensure the current tool is not in the stored suggestions
        const filteredSuggestions = parsedSuggestions.filter((tool: any) => tool.id !== currentToolId);
        if (filteredSuggestions.length >= 5) {
          setSuggestions(filteredSuggestions.slice(0, 5));
          return; // Exit if we have enough valid suggestions
        }
       } catch (e) {
         // ignore parsing error, regenerate below
       }
    }
    
    // If cache is old, invalid, or doesn't have enough items after filtering, regenerate.
    const newSuggestions = getSuggestions();
    setSuggestions(newSuggestions);
    localStorage.setItem('toolSuggestions', JSON.stringify(newSuggestions));
    localStorage.setItem('toolSuggestionsLastUpdated', now.toString());


    const interval = setInterval(() => {
        const newSuggestions = getSuggestions();
        setSuggestions(newSuggestions);
        localStorage.setItem('toolSuggestions', JSON.stringify(newSuggestions));
        localStorage.setItem('toolSuggestionsLastUpdated', new Date().getTime().toString());
    }, thirtyMinutes);

    return () => clearInterval(interval);
  }, [currentToolId]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 w-full">
      <h2 className="text-2xl font-bold text-center mb-6 text-glow">
        More tools you might like
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {suggestions.map((tool) => {
          const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.Wand2;
          return (
            <Link href={`/${tool.id}`} key={tool.id} className="group">
              <Card className="h-full p-4 flex flex-col items-center text-center bg-background/50 hover:bg-card hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{tool.name}</h3>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
