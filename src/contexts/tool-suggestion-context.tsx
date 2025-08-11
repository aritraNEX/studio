
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import toolSuggestionsData from '@/data/tool-suggestions.json';

interface Tool {
    toolId: string;
    name: string;
    category: string;
    description: string;
    relevanceTags: string[];
}

interface ToolSuggestionContextType {
  tools: Tool[];
  getSuggestions: (usedTools: string[], currentCategory: string) => Tool[];
}

const ToolSuggestionContext = createContext<ToolSuggestionContextType | undefined>(undefined);

export const ToolSuggestionProvider = ({ children }: { children: ReactNode }) => {
  const tools: Tool[] = toolSuggestionsData.tools;

  const getSuggestions = (usedTools: string[], currentCategory: string): Tool[] => {
    // Filter out tools that have already been used
    const availableTools = tools.filter(tool => !usedTools.includes(tool.toolId));

    // Rank available tools
    const rankedTools = availableTools.map(tool => {
        let score = 0;
        // High score for matching the current project category
        if (tool.category.toLowerCase() === currentCategory.toLowerCase()) {
            score += 5;
        }
        // Score for matching relevance tags with used tools' categories/tags
        usedTools.forEach(usedToolId => {
            const usedTool = tools.find(t => t.toolId === usedToolId);
            if (usedTool) {
                const commonTags = tool.relevanceTags.filter(tag => usedTool.relevanceTags.includes(tag));
                score += commonTags.length;
            }
        });
        return { ...tool, score };
    });

    // Sort by score and take the top 3
    return rankedTools.sort((a, b) => b.score - a.score).slice(0, 3);
  };

  return (
    <ToolSuggestionContext.Provider value={{ tools, getSuggestions }}>
      {children}
    </ToolSuggestionContext.Provider>
  );
};

export const useToolSuggestions = () => {
  const context = useContext(ToolSuggestionContext);
  if (context === undefined) {
    throw new Error('useToolSuggestions must be used within a ToolSuggestionProvider');
  }
  return context;
};
