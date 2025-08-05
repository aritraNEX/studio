
"use client";

import Link from "next/link";
import {
  Sparkles, Quote, BookText, Languages, Palette, ShieldCheck, Wand2, GraduationCap, AudioLines, FileText, FunctionSquare, Video, PenSquare, Copy, BookA, SpellCheck, BrainCircuit, Share2, StickyNote, Gauge, BookUp, Users, MessageSquare, Puzzle, Camera, Notebook
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import UserMenu from "@/components/user-menu";
import AboutFooter from "@/components/about-footer";
import { useLanguage } from "@/contexts/language-context";

const VesperIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
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
    return (
        <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background to-muted/50">
             <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                     <Link href="/" className="flex items-center gap-2 font-bold">
                        <VesperIcon />
                        <span>Vesper</span>
                    </Link>
                    <UserMenu />
                </div>
            </header>
            <main className="flex flex-1 flex-col items-center p-4 sm:p-8">
                <div className="w-full max-w-4xl">
                     <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                          {t('welcome_title')}
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                          {t('welcome_subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                         <Link href="/workspace" className={cn(buttonVariants({ variant: 'outline' }), "h-16 text-lg justify-start p-6")}>
                            <Wand2 className="mr-4 h-6 w-6" /> {t('features.workspace')}
                        </Link>
                        <Link href="/chat" className={cn(buttonVariants({ variant: 'outline' }), "h-16 text-lg justify-start p-6")}>
                            <VesperIcon /> <span className="ml-4">{t('vesper_ai_studio')}</span>
                        </Link>
                        <Link href="/integrations" className={cn(buttonVariants({ variant: 'outline' }), "h-16 text-lg justify-start p-6")}>
                            <Puzzle className="mr-4 h-6 w-6" /> {t('integrations_button')}
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {allFeatures.map((feature) => {
                             const Icon = feature.icon;
                             return (
                                <Link href={feature.href} key={feature.href} legacyBehavior>
                                    <a className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:shadow-md hover:-translate-y-1">
                                        <Icon className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary" />
                                        <span className="text-sm font-medium text-center">{t(`features.${feature.label.toLowerCase().replace(/ /g, '-')}`)}</span>
                                    </a>
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
