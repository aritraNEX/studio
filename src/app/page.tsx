
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
  ListTodo,
} from "lucide-react";
import UserMenu from "@/components/user-menu";
import { useLanguage } from "@/contexts/language-context";
import WelcomeBanner from "@/components/welcome-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

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
    { section: 'high_quality', href: '/task-planner', icon: ListTodo, label: 'Task Planner' },
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
            <Link href={tool.href} key={tool.href} className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 dark:bg-card/50 p-4 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-card/80">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-white/90">{getTranslatedToolLabel(tool.label)}</span>
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-gradient-to-br from-[#1e145f] via-[#2d2182] to-[#4032a8] text-white">
            <header className="sticky top-0 z-50 w-full bg-transparent">
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
                
                <div className="my-8 grid grid-cols-1 gap-4">
                    <Link href="/workspace" className="flex items-center gap-4 rounded-2xl bg-white/10 dark:bg-card/50 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-card/80 text-white">
                        <Wand2 className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">{t('features.workspace')}</h3>
                            <p className="text-sm text-white/70">Chain AI operations together.</p>
                        </div>
                    </Link>
                    <Link href="/chat" className="flex items-center gap-4 rounded-2xl bg-white/10 dark:bg-card/50 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-card/80 text-white">
                        <Sparkles className="h-8 w-8 text-primary" />
                         <div>
                            <h3 className="font-semibold">{t('features.vesper_ai_studio')}</h3>
                            <p className="text-sm text-white/70">Chat with Vesper AI.</p>
                        </div>
                    </Link>
                     <Link href="/integrations" className="flex items-center gap-4 rounded-2xl bg-white/10 dark:bg-card/50 p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-card/80 text-white">
                        <Puzzle className="h-8 w-8 text-primary" />
                        <div>
                            <h3 className="font-semibold">{t('features.integrations')}</h3>
                            <p className="text-sm text-white/70">Works where you do.</p>
                        </div>
                    </Link>
                </div>

                {mostPopularTools.length > 0 && (
                    <div className="my-8">
                        <h2 className="text-2xl font-bold tracking-tight text-white/90">{t('most_popular')}</h2>
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {mostPopularTools.map(renderToolCard)}
                        </div>
                    </div>
                )}
                
                {highQualityTools.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-white/90">{t('high_quality')}</h2>
                         <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                            {highQualityTools.map(renderToolCard)}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
