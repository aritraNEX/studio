
"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import * as LucideIcons from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";

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
    { href: '/paraphrase', icon: 'Quote', label: 'Paraphrase' },
    { href: '/summarize', icon: 'BookText', label: 'Summarize' },
    { href: '/explainer', icon: 'BrainCircuit', label: 'Explainer' },
    { href: '/grammar', icon: 'SpellCheck', label: 'Grammar' },
    { href: '/vocabulary', icon: 'BookUp', label: 'Vocabulary' },
    { href: '/style', icon: 'Palette', label: 'Style' },
    { href: '/diagrams', icon: 'Share2', label: 'Diagrams' },
    { href: '/video-transcription', icon: 'Video', label: 'Video to Text' },
    { href: '/tts', icon: 'AudioLines', label: 'TTS' },
    { href: '/translate', icon: 'Languages', label: 'Translate' },
    { href: '/citations', icon: 'BookA', label: 'Citations' },
    { href: '/tone-detection', icon: 'Gauge', label: 'Tone' },
    { href: '/plagiarism', icon: 'ShieldCheck', label: 'Plagiarism' },
    { href: '/research', icon: 'GraduationCap', label: 'Research' },
    { href: '/formula', icon: 'FunctionSquare', label: 'Formula' },
    { href: '/flashcards', icon: 'Copy', label: 'Flashcards' },
    { href: '/batch-summary', icon: 'FileText', label: 'Batch Summary' },
    { href: '/batch-paraphrase', icon: 'FileText', label: 'Batch Paraphrase' },
    { href: '/notepad', icon: 'Notebook', label: 'Notepad' },
    { href: '/integrations', icon: 'Puzzle', label: 'Integrations' },
    { href: '/task-planner', icon: 'ListTodo', label: 'Task Planner' },
];


export default function WorkspaceSidebar() {
  const { t } = useLanguage();

  const getTranslatedToolLabel = (label: string) => {
    const translationKey = `features.${label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_')}`;
    return t(translationKey);
  };
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <VesperIcon />
                <span className="text-foreground group-data-[collapsible=icon]:hidden">Vesper</span>
            </Link>
            <div className="ml-auto group-data-[collapsible=icon]:hidden">
                <SidebarTrigger />
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
         <SidebarMenu>
          {allTools.map((tool) => {
            const Icon = (LucideIcons as any)[tool.icon] || LucideIcons.HelpCircle;
            return (
              <SidebarMenuItem key={tool.href}>
                <Link href={tool.href} className="w-full">
                  <SidebarMenuButton tooltip={getTranslatedToolLabel(tool.label)}>
                    <Icon />
                    <span>{getTranslatedToolLabel(tool.label)}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
