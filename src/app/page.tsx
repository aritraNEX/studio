"use client";

import Link from "next/link";
import {
  Sparkles, Quote, BookText, Languages, Palette, ShieldCheck, Wand2, GraduationCap, AudioLines, FileText, FunctionSquare, Video, PenSquare, Copy, BookA, SpellCheck, BrainCircuit, Share2, StickyNote, Gauge, BookUp, Users, MessageSquare, Puzzle, Camera, Notebook
} from "lucide-react";
import UserMenu from "@/components/user-menu";
import AboutFooter from "@/components/about-footer";
import { useLanguage } from "@/contexts/language-context";
import WelcomeBanner from "@/components/welcome-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const VesperIcon = () => (
    <svg
        width="48"
        height="48"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12"
        >
        <circle cx="40" cy="40" r="30" className="fill-primary" />
        <circle cx="70" cy="35" r="20" className="fill-primary/70" />
        <circle cx="65" cy="75" r="25" className="fill-accent" />
        <circle cx="80" cy="70" r="10" className="fill-primary" />
    </svg>
);

const allFeatures = [
    { href: '/paraphrase', icon: Quote, label: 'Paraphrase' },
    { href: '/summarize', icon: BookText, label: 'Summarize' },
    { href: '/grammar', icon: SpellCheck, label: 'Grammar' },
    { href: '/translate', icon: Languages, label: 'Translate' },
    { href: '/style', icon: Palette, label: 'Style' },
    { href: '/explainer', icon: BrainCircuit, label: 'Explainer' },
    { href: '/diagrams', icon: Share2, label: 'Diagrams' },
    { href: '/assignment-maker', icon: PenSquare, label: 'Assignment' },
    { href: '/note-generator', icon: StickyNote, label: 'Note-mentor' },
    { href: '/flashcards', icon: Copy, label: 'Flashcards' },
    { href: '/citations', icon: BookA, label: 'Citations' },
    { href: '/vocabulary', icon: BookUp, label: 'Vocabulary' },
    { href: '/tone-detection', icon: Gauge, label: 'Tone' },
    { href: '/video-transcription', icon: Video, label: 'Video to Text' },
    { href: '/research', icon: GraduationCap, label: 'Research' },
    { href: '/plagiarism', icon: ShieldCheck, label: 'Plagiarism' },
    { href: '/tts', icon: AudioLines, label: 'TTS' },
    { href: '/formula', icon: FunctionSquare, label: 'Formula' },
    { href: '/lens', icon: Camera, label: 'Lens' },
    { href: '/batch-summary', icon: FileText, label: 'Batch Summary' },
    { href: '/batch-paraphrase', icon: FileText, label: 'Batch Paraphrase' },
    { href: '/notepad', icon: Notebook, label: 'Notepad' },
];

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [animationsEnabled, setAnimationsEnabled] = useState(false);

    useEffect(() => {
      setAnimationsEnabled(localStorage.getItem("texio-animations-enabled") === "true");
    }, []);

    return (
        <div 
            className={cn(
                "flex min-h-screen w-full flex-col transition-all duration-500",
                animationsEnabled && "animated-background"
              )}
            style={{
                background: `radial-gradient(ellipse 80% 80% at 50% -20%, hsl(var(--primary) / 0.3), transparent),
                             radial-gradient(ellipse 80% 80% at 50% 120%, hsl(var(--accent) / 0.3), transparent),
                             hsl(var(--background))`,
                backgroundSize: '200% 200%',
            }}
        >
             <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/30 backdrop-blur-sm">
                <div className="container flex h-14 items-center justify-end">
                    <UserMenu />
                </div>
            </header>
            <main className="flex flex-1 flex-col items-center p-4 sm:p-8">
                <div className="w-full max-w-5xl">
                     <WelcomeBanner user={user} />
                     <div className="text-center mb-12">
                        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-foreground mt-4">
                          {t('welcome_title')}
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                          {t('welcome_subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                         <Link href="/workspace" className="glass-card h-16 text-lg justify-start p-6 text-foreground hover:border-primary/50 transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-1">
                            <Wand2 className="mr-4 h-6 w-6 text-primary" /> {t('features.workspace')}
                        </Link>
                        <Link href="/chat" className="glass-card h-16 text-lg justify-start p-6 text-foreground hover:border-primary/50 transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-1">
                            <Sparkles className="mr-4 h-6 w-6 text-primary" /> <span>{t('vesper_ai_studio')}</span>
                        </Link>
                        <Link href="/integrations" className="glass-card h-16 text-lg justify-start p-6 text-foreground hover:border-primary/50 transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-1">
                            <Puzzle className="mr-4 h-6 w-6 text-primary" /> {t('integrations_button')}
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {allFeatures.map((feature) => {
                             const Icon = feature.icon;
                             return (
                                <Link
                                    href={feature.href}
                                    key={feature.href}
                                    className="group glass-card relative flex flex-col items-center justify-center gap-2 p-6 text-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
                                >
                                    <div className="relative p-3 rounded-full bg-primary/10 transition-colors duration-300">
                                      <Icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                                    </div>
                                    <span className="text-sm font-medium text-center relative">{t(`features.${feature.label.toLowerCase().replace(/ /g, '-')}`)}</span>
                                </Link>
                             )
                        })}
                    </div>
                </div>
            </main>
             <div className="container mx-auto px-4 sm:px-8">
               <AboutFooter />
            </div>
        </div>
    );
}
