
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
  Search,
} from "lucide-react";
import UserMenu from "@/components/user-menu";
import { useLanguage } from "@/contexts/language-context";
import WelcomeBanner from "@/components/welcome-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from 'react';
import AdBanner from "@/components/ad-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const allTools = [
    { section: 'most_popular', href: '/paraphrase', icon: Quote, label: 'Paraphrase' },
    { section: 'most_popular', href: '/summarize', icon: BookText, label: 'Summarize' },
    { section: 'most_popular', href: '/explainer', icon: BrainCircuit, label: 'Explainer' },
    { section: 'most_popular', href: '/grammar', icon: SpellCheck, label: 'Grammar' },
    { section: 'most_popular', href: '/vocabulary', icon: BookUp, label: 'Vocabulary' },
    { section: 'most_popular', href: '/style', icon: Palette, label: 'Style' },
    { section: 'most_popular', href: '/assignment-maker', icon: PenSquare, label: 'Assignment' },
    { section: 'high_quality', href: '/note-generator', icon: StickyNote, label: 'Note-mentor' },
    { section: 'high_quality', href: '/diagrams', icon: Share2, label: 'Diagrams' },
    { section: 'high_quality', href: '/video-transcription', icon: Video, label: 'Video to Text' },
    { section: 'high_quality', href: '/tts', icon: AudioLines, label: 'TTS' },
    { section: 'high_quality', href: '/translate', icon: Languages, label: 'Translate' },
    { section: 'high_quality', href: '/citations', icon: BookA, label: 'Citations' },
    { section: 'high_quality', href: '/tone-detection', icon: Gauge, label: 'Tone' },
    { section: 'high_quality', href: '/plagiarism', icon: ShieldCheck, label: 'Plagiarism' },
    { section: 'high_quality', href: '/research', icon: GraduationCap, label: 'Research' },
    { section: 'high_quality', href: '/formula', icon: FunctionSquare, label: 'Formula' },
    { section: 'high_quality', href: '/flashcards', icon: Copy, label: 'Flashcards' },
    { section: 'high_quality', href: '/batch-summary', icon: FileText, label: 'Batch Summary' },
    { section: 'high_quality', href: '/batch-paraphrase', icon: FileText, label: 'Batch Paraphrase' },
    { section: 'high_quality', href: '/notepad', icon: Notebook, label: 'Notepad' },
    { section: 'high_quality', href: '/integrations', icon: Puzzle, label: 'Integrations' },
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
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
        setGradient(getGradientByHour());
        }, 5000); // Update every 5 seconds to check the time
        return () => clearInterval(interval);
    }, []);

    const getTranslatedToolLabel = (label: string) => {
        const translationKey = `features.${label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')}`;
        return t(translationKey);
    };

    const filteredTools = allTools.filter(tool => 
        getTranslatedToolLabel(tool.label).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const mostPopularTools = filteredTools.filter(tool => tool.section === 'most_popular');
    const highQualityTools = filteredTools.filter(tool => tool.section === 'high_quality');

    const renderToolCard = (tool: { href: string; icon: React.ElementType; label: string }) => {
        const Icon = tool.icon;
        return (
            <Link href={tool.href} key={tool.href} className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-card p-4 text-center transition-all duration-300 hover:bg-primary/10 hover:shadow-lg hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">{getTranslatedToolLabel(tool.label)}</span>
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
                
                <div className="my-8 max-w-2xl mx-auto">
                    <div className="relative group">
                         <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg blur opacity-0 group-focus-within:opacity-75 transition-opacity duration-300 animate-glowing-border"></div>
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search for a tool..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 h-12 text-base rounded-lg border-2 border-transparent focus:ring-0 focus:border-transparent bg-background/80"
                            />
                        </div>
                    </div>
                </div>

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

                {mostPopularTools.length > 0 && (
                    <div className="my-8">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('most_popular')}</h2>
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                            {mostPopularTools.map(renderToolCard)}
                        </div>
                    </div>
                )}
                
                <AdBanner />

                {highQualityTools.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('high_quality')}</h2>
                         <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                            {highQualityTools.map(renderToolCard)}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
