
"use client";

import Link from "next/link";
import {
  Wand2,
  Puzzle,
  Quote,
  Languages,
  BookText,
  Palette,
  BrainCircuit,
  Share2,
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
  ListTodo,
} from "lucide-react";
import UserMenu from "@/components/user-menu";
import { useLanguage } from "@/contexts/language-context";
import WelcomeBanner from "@/components/welcome-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ToolSuggestionCard from "@/components/tool-suggestion-card";

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

const NewVesperLogo = () => (
    <svg
      width="100"
      height="100"
      viewBox="0 0 115 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M72.484 105.003c27.207-11.205 40.54-41.48 30.523-68.575C93.076 9.49 61.06 0 35.152 0 14.28 0 0 13.098 0 32.555c0 17.58 13.11 32.89 27.873 37.33 13.52 4.07 33.193 11.082 29.623 27.5-3.32 15.22-1.39 6.84 14.988 7.618Z"
        fill="url(#paint0_linear_1_2)"
      />
      <circle cx="58.5" cy="30.5" r="30.5" fill="url(#paint1_linear_1_2)" />
      <defs>
        <linearGradient
          id="paint0_linear_1_2"
          x1="57.5"
          y1="0"
          x2="57.5"
          y2="106"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4D00B3" />
          <stop offset="1" stopColor="#3366FF" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1_2"
          x1="58.5"
          y1="0"
          x2="58.5"
          y2="61"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4D00B3" stopOpacity="0.7" />
          <stop offset="1" stopColor="#3366FF" stopOpacity="0.9" />
        </linearGradient>
      </defs>
    </svg>
);

const allTools = [
    { section: 'most_popular', href: '/paraphrase', icon: Quote, label: 'Paraphrase' },
    { section: 'most_popular', href: '/summarize', icon: BookText, label: 'Summarize' },
    { section: 'most_popular', href: '/explainer', icon: BrainCircuit, label: 'Explainer' },
    { section: 'most_popular', href: '/grammar', icon: SpellCheck, label: 'Grammar' },
    { section: 'most_popular', href: '/vocabulary', icon: BookUp, label: 'Vocabulary' },
    { section: 'most_popular', href: '/style', icon: Palette, label: 'Style' },
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
    { section: 'high_quality', href: '/task-manager', icon: ListTodo, label: 'Task Manager' },
];

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    const getTranslatedToolLabel = (label: string) => {
        const translationKey = `features.${label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')}`;
        return t(translationKey);
    };

    const mostPopularTools = allTools.filter(tool => tool.section === 'most_popular');
    const highQualityTools = allTools.filter(tool => tool.section === 'high_quality');

    const renderToolCard = (tool: { href: string; icon: React.ElementType; label: string }) => {
        const Icon = tool.icon;
        return (
            <Link href={tool.href} key={tool.href} className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-card/80">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-foreground">{getTranslatedToolLabel(tool.label)}</span>
            </Link>
        );
    };

    if (!user) {
        return (
             <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground">
                <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
                    <div className="container flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                            <VesperIcon />
                            <span>Vesper</span>
                        </Link>
                    </div>
                </header>
                <main className="flex-1 w-full container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center text-center">
                     <div className="mb-6">
                        <NewVesperLogo />
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
                        Welcome to Vesper
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8">Sign in or create an account to continue</p>
                    <Button asChild size="lg">
                        <Link href="/login">Sign In / Sign Up</Link>
                    </Button>
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-background text-foreground">
            <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <VesperIcon />
                        <span>Vesper</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <UserMenu />
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-center mb-6">
                    <NewVesperLogo />
                </div>

                <WelcomeBanner user={user} />

                <ToolSuggestionCard />
                
                <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Link href="/workspace" className="flex items-center gap-4 rounded-xl bg-card p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card/80 text-foreground">
                        <Wand2 className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">{t('features.workspace')}</h3>
                            <p className="text-sm text-muted-foreground">Your personal space for tasks and projects.</p>
                        </div>
                    </Link>
                     <Link href="/integrations" className="flex items-center gap-4 rounded-xl bg-card p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-card/80 text-foreground">
                        <Puzzle className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">{t('features.integrations')}</h3>
                            <p className="text-sm text-muted-foreground">Works where you do.</p>
                        </div>
                    </Link>
                </div>

                {mostPopularTools.length > 0 && (
                    <div className="my-8">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('most_popular')}</h2>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                            {mostPopularTools.map(renderToolCard)}
                        </div>
                    </div>
                )}
                
                {highQualityTools.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('high_quality')}</h2>
                         <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
                            {highQualityTools.map(renderToolCard)}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
