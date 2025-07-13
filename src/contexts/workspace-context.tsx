
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'tts';

interface WorkspaceContextType {
  workspaceText: string;
  setWorkspaceText: (text: string) => void;
  workspaceOperation: Operation | null;
  setWorkspaceOperation: (operation: Operation | null) => void;
  setActiveTab: (tab: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceText, setWorkspaceText] = useState("");
  const [workspaceOperation, setWorkspaceOperation] = useState<Operation | null>(null);
  const [activeTab, setActiveTab] = useState("paraphrase"); // Dummy state, real state is in TexioApp

  const contextValue = {
    workspaceText,
    setWorkspaceText,
    workspaceOperation,
    setWorkspaceOperation,
    setActiveTab: () => {}, // This will be overridden by TexioApp
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
