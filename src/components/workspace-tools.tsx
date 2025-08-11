
"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useAuth } from "@/contexts/auth-context";
import { useToolSuggestions } from "@/contexts/tool-suggestion-context";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as LucideIcons from "lucide-react";
import { Lightbulb, Loader2 } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar";

interface Project {
  operation: string;
}

export function WorkspaceTools() {
  const { user } = useAuth();
  const { getSuggestions } = useToolSuggestions();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const fetchRecentActivityAndSuggest = async () => {
      setLoading(true);
      try {
        const projectsRef = collection(db, "projects");
        const q = query(
          projectsRef, 
          where("userId", "==", user.uid), 
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const recentProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          recentProjects.push(doc.data() as Project);
        });

        const usedTools = recentProjects.map(p => p.operation);
        const currentCategory = recentProjects[0]?.operation || 'writing';

        const finalSuggestions = getSuggestions(usedTools, currentCategory);
        setSuggestions(finalSuggestions);

      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivityAndSuggest();
  }, [user, getSuggestions]);

  const getIconByName = (iconName: string): React.ElementType => {
    const iconKey = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    return (LucideIcons as any)[iconKey] || Lightbulb;
  }

  if (loading) {
    return <div className="px-2 py-1 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div>
        {suggestions.map((tool) => {
            const Icon = getIconByName(tool.icon || tool.toolId);
            return (
                <SidebarMenuItem key={tool.toolId}>
                    <Link href={`/${tool.toolId}`} className="w-full">
                        <SidebarMenuButton tooltip={tool.name} size="sm">
                            <Icon />
                            <span>{tool.name}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )
        })}
    </div>
  );
}
