
"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";
import { type LucideIcon } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface ToolPageLayoutProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

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


export default function ToolPageLayout({ title, subtitle, icon: Icon, children }: ToolPageLayoutProps) {
    const { t } = useLanguage();
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gradient-to-br from-background to-muted/50">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold">
                <VesperIcon />
                <span>Vesper</span>
            </Link>
            <div className="flex items-center gap-2">
                <Button asChild variant="outline">
                    <Link href="/chat">
                         <VesperIcon />
                         <span className="ml-2">{t('vesper_ai_studio')}</span>
                    </Link>
                </Button>
                <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 w-full container mx-auto p-4 sm:p-8">
            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
                    <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
                </div>
            </div>
            {children}
        </main>
      </div>
    );
}
