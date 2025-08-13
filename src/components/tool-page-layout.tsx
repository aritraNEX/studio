
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";
import * as LucideIcons from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { ArrowLeft } from "lucide-react";
import { ToolSuggestions } from "./tool-suggestions";

interface ToolPageLayoutProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof LucideIcons;
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


export default function ToolPageLayout({ title, subtitle, iconName, children }: ToolPageLayoutProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const Icon = LucideIcons[iconName] as LucideIcons.LucideIcon;
    
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-gradient-to-br from-background to-muted/50">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <Link href="/" className="flex items-center gap-2 font-bold">
                    <VesperIcon />
                    <span>Vesper</span>
                </Link>
            </div>
            <div className="flex items-center gap-2">
                <UserMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 w-full container mx-auto p-4 sm:p-8">
            <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {Icon ? <Icon className="h-8 w-8" /> : null}
                </div>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
                    <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>
                </div>
            </div>
            {children}
            <ToolSuggestions />
        </main>
      </div>
    );
}
