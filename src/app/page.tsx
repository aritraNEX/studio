
"use client";

import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Puzzle,
  Quote,
} from "lucide-react";
import UserMenu from "@/components/user-menu";
import AboutFooter from "@/components/about-footer";
import { useLanguage } from "@/contexts/language-context";
import WelcomeBanner from "@/components/welcome-banner";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const VesperLogo = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 108 92"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-16 w-16 md:h-20 md:w-20 text-white"
  >
    <path
      d="M26.748 89.25C19.78 89.25 14.85 84.58 14.85 79.6V12.14C14.85 7.16 19.78 2.5 26.748 2.5H35.25C42.22 2.5 47.15 7.16 47.15 12.14V72.93C47.15 77.9 42.22 82.57 35.25 82.57H32.48C31.54 82.57 30.63 82.16 30.01 81.44L18.45 66.86"
      stroke="currentColor"
      strokeWidth="5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M72.2811 89.25C79.2511 89.25 84.1811 84.58 84.1811 79.6V12.14C84.1811 7.16 79.2511 2.5 72.2811 2.5H63.7811C56.8111 2.5 51.8811 7.16 51.8811 12.14V72.93C51.8811 77.9 56.8111 82.57 63.7811 82.57H66.5511C67.4911 82.57 68.4011 82.16 69.0211 81.44L80.5811 66.86"
      stroke="currentColor"
      strokeWidth="5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const featureLinks = [
  { href: '/workspace', icon: Wand2, label: 'Workspace' },
  { href: '/chat', icon: Sparkles, label: 'Vesper AI Studio' },
  { href: '/integrations', icon: Puzzle, label: 'Integrations' },
];

export default function DashboardPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
        <div 
            className="flex min-h-screen w-full flex-col text-white animated-gradient"
        >
            <main className="flex flex-1 flex-col items-center p-4 sm:p-8">
                <div className="w-full max-w-md mx-auto flex flex-col h-full">
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <WelcomeBanner user={user} />
                        
                        <div className="my-8 animate-in fade-in-0 slide-in-from-top-10 duration-1000 delay-300">
                           <VesperLogo />
                        </div>

                        <h1 className="text-6xl md:text-7xl font-bold tracking-tight animate-in fade-in-0 slide-in-from-top-10 duration-1000 delay-500">
                          {t('welcome_title')}
                        </h1>
                        <p className="mt-4 text-xl md:text-2xl text-white/80 animate-in fade-in-0 slide-in-from-top-10 duration-1000 delay-700">
                          {t('welcome_subtitle')}
                        </p>
                    </div>

                    <div className="space-y-4 pb-8 animate-in fade-in-0 slide-in-from-bottom-10 duration-1000 delay-900">
                        {featureLinks.map((feature, index) => {
                             const Icon = feature.icon;
                             return (
                                <Link
                                    href={feature.href}
                                    key={feature.href}
                                    className="group glass-btn relative flex w-full items-center gap-4 p-4 text-lg font-medium rounded-2xl text-white transition-all duration-300 hover:border-white/50 transform hover:scale-105"
                                >
                                    <Icon className="h-6 w-6" />
                                    <span>{t(`features.${feature.label.toLowerCase().replace(/ /g, '-')}`)}</span>
                                </Link>
                             )
                        })}
                         <div
                            className="group glass-btn relative flex w-full items-center justify-between gap-4 p-4 text-lg font-medium rounded-2xl text-white transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <Quote className="h-6 w-6" />
                                <span>{t(`features.paraphrase`)}</span>
                            </div>
                            <Switch id="paraphrase-toggle" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
