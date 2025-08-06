
"use client";

import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Puzzle,
  Quote,
  Languages,
  BookText,
  Palette,
  BrainCircuit,
  Share2,
  PenSquare,
  StickyNote,
  Copy,
  BookA,
  BookUp,
  ShieldCheck,
  Gauge,
  GraduationCap,
  Video,
  AudioLines,
  FunctionSquare,
  Camera,
  Notebook,
  FileText,
  SpellCheck,
} from "lucide-react";
import UserMenu from "@/components/user-menu";
import { useLanguage } from "@/contexts/language-context";
import WelcomeBanner from "@/components/welcome-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from 'react';
import AdBanner from "@/components/ad-banner";
import { Button } from "@/components/ui/button";

const VesperIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-primary"
        >
        <circle cx="40" cy="40" r="30" className="fill-primary" />
        <circle cx="70" cy="35" r="20" className="fill-primary/70" />
        <circle cx="65" cy="75" r="25" className="fill-accent" />
        <circle cx="80" cy="70" r="10" className="fill-primary" />
    </svg>
);


const mostPopularTools = [
  { href: '/paraphrase', icon: Quote, label: 'Paraphrase' },
  { href: '/summarize', icon: BookText, label: 'Summarize' },
  { href: '/explainer', icon: BrainCircuit, label: 'Explainer' },
  { href: '/grammar', icon: SpellCheck, label: 'Grammar' },
  { href: '/vocabulary', icon: BookUp, label: 'Vocabulary' },
  { href: '/style', icon: Palette, label: 'Style' },
  { href: '/assignment-maker', icon: PenSquare, label: 'Assignment' },
];

const highQualityTools = [
  { href: '/note-generator', icon: StickyNote, label: 'Note-mentor' },
  { href: '/diagrams', icon: Share2, label: 'Diagrams' },
  { href: '/video-transcription', icon: Video, label: 'Video to Text' },
  { href: '/tts', icon: AudioLines, label: 'TTS' },
  { href: '/translate', icon: Languages, label: 'Translate' },
  { href: '/citations', icon: BookA, label: 'Citations' },
  { href: '/tone-detection', icon: Gauge, label: 'Tone' },
  { href: '/plagiarism', icon: ShieldCheck, label: 'Plagiarism' },
  { href: '/research', icon: GraduationCap, label: 'Research' },
  { href: '/formula', icon: FunctionSquare, label: 'Formula' },
  { href: '/flashcards', icon: Copy, label: 'Flashcards' },
  { href: '/batch-summary', icon: FileText, label: 'Batch Summary' },
  { href: '/batch-paraphrase', icon: FileText, label: 'Batch Paraphrase' },
  { href: '/notepad', icon: Notebook, label: 'Notepad' },
  { href: '/integrations', icon: Puzzle, label: 'Integrations' },
];

const getGradientByHour = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'from-sky-100 via-blue-100 to-cyan-100'; // Softer Morning
  if (hour >= 11 && hour < 17) return 'from-yellow-50 via-orange-100 to-pink-100'; // Softer Afternoon
  if (hour >= 17 && hour < 20) return 'from-red-100 via-purple-200 to-indigo-200'; // Softer Evening
  return 'from-gray-800 via-blue-900 to-black'; // Night
};

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [gradient, setGradient] = useState(getGradientByHour());

    useEffect(() => {
        const interval = setInterval(() => {
        setGradient(getGradientByHour());
        }, 5000); // Update every 5 seconds to check the time
        return () => clearInterval(interval);
    }, []);

    const renderToolCard = (tool: { href: string; icon: React.ElementType; label: string }) => {
        const Icon = tool.icon;
        const translationKey = `features.${tool.label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')}`;
        return (
            <Link href={tool.href} key={tool.href} className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-card p-4 text-center transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">{t(translationKey)}</span>
            </Link>
        );
    };

    return (
        <div className={cn("flex min-h-screen w-full flex-col items-center bg-gradient-to-br transition-all duration-[5000ms] ease-linear", gradient)}>
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <VesperIcon />
                        <span>Vesper</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <UserMenu />
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WelcomeBanner user={user} />
                
                <div className="my-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/workspace" className="flex items-center gap-4 rounded-xl bg-card p-4 transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:-translate-y-1">
                        <Wand2 className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold text-foreground">{t('features.workspace')}</h3>
                            <p className="text-sm text-muted-foreground">Chain AI operations together.</p>
                        </div>
                    </Link>
                    <Link href="/chat" className="flex items-center gap-4 rounded-xl bg-card p-4 transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:-translate-y-1">
                        <Sparkles className="h-8 w-8 text-primary" />
                         <div>
                            <h3 className="font-semibold text-foreground">{t('features.vesper_ai_studio')}</h3>
                            <p className="text-sm text-muted-foreground">Chat with Vesper AI.</p>
                        </div>
                    </Link>
                    <Link href="/integrations" className="flex items-center gap-4 rounded-xl bg-card p-4 transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
                        <Puzzle className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold text-foreground">{t('features.integrations')}</h3>
                            <p className="text-sm text-muted-foreground">Works where you do.</p>
                        </div>
                    </Link>
                </div>

                <div className="my-8">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('most_popular')}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                        {mostPopularTools.map(renderToolCard)}
                    </div>
                </div>
                
                <AdBanner />

                <div className="mt-8">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('high_quality')}</h2>
                     <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                        {highQualityTools.map(renderToolCard)}
                    </div>
                </div>
            </main>
        </div>
    );
}
