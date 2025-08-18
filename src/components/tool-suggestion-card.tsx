
"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useAuth } from "@/contexts/auth-context";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import * as LucideIcons from "lucide-react";
import { Lightbulb, Loader2 } from "lucide-react";
import allToolsData from '@/data/all-tools.json';

interface Project {
  operation: string;
}

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: keyof typeof LucideIcons;
    category: string;
}

export default function ToolSuggestionCard() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const fetchRecentActivityAndSuggest = async () => {
      setLoading(true);
      try {
        const projectsRef = collection(db, "users", user.uid, "projects");
        const q = query(
          projectsRef, 
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const recentProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          recentProjects.push(doc.data() as Project);
        });

        const usedToolIds = [...new Set(recentProjects.map(p => p.operation))];
        const recentCategory = recentProjects[0]?.operation ? allToolsData.find(t => t.id === recentProjects[0].operation)?.category : 'writing';

        const availableTools = allToolsData.filter(tool => !usedToolIds.includes(tool.id));
        
        const scoredTools = availableTools.map(tool => ({
            ...tool,
            score: tool.category.toLowerCase() === recentCategory ? 2 : 1 // Simple scoring
        }));

        const finalSuggestions = scoredTools.sort((a,b) => b.score - a.score).slice(0, 3);
        setSuggestions(finalSuggestions as Tool[]);

      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivityAndSuggest();
  }, [user]);

  const getIconByName = (iconName: keyof typeof LucideIcons): React.ElementType => {
    if (!iconName) return Lightbulb;
    return LucideIcons[iconName] || Lightbulb;
  }

  if (loading) {
    return (
        <Card className="my-8">
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb /> For You</CardTitle>
                <CardDescription>Analyzing your activity to suggest tools...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="my-8 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="text-yellow-400" /> Recommended For You</CardTitle>
            <CardDescription>Based on your recent activity, you might find these tools helpful.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {suggestions.map((tool) => {
                    const Icon = getIconByName(tool.icon);
                    return (
                        <Link href={`/${tool.id}`} key={tool.id} className="group">
                             <div className="p-4 bg-background/60 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-5 w-5" />
                                     </div>
                                    <h3 className="font-semibold text-foreground">{tool.name}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground flex-grow">{tool.description}</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </CardContent>
    </Card>
  );
}
