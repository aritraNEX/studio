
"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { useAuth } from "@/contexts/auth-context";
import { useToolSuggestions } from "@/contexts/tool-suggestion-context";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import * as LucideIcons from "lucide-react";
import { Lightbulb, Loader2 } from "lucide-react";

interface Project {
  operation: string;
}

export default function ToolSuggestionCard() {
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
          limit(5) // Look at last 5 projects for recent activity
        );

        const querySnapshot = await getDocs(q);
        const recentProjects: Project[] = [];
        querySnapshot.forEach((doc) => {
          recentProjects.push(doc.data() as Project);
        });

        const usedTools = recentProjects.map(p => p.operation);
        // Assuming current category from the most recent project, or 'general'
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
    return null; // Don't show the card if there are no suggestions
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
                    const Icon = getIconByName(tool.toolId);
                    return (
                        <Link href={`/${tool.toolId}`} key={tool.toolId} className="group">
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
