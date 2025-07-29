
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Operation = 'paraphrase' | 'summarize' | 'translate' | 'style' | 'grammar';

export interface WorkspaceStep {
  id: number;
  operation: Operation;
  text: string;
  options?: {
    lang?: string;
    style?: string;
  }
}

interface WorkspaceContextType {
  workspaceSteps: WorkspaceStep[];
  setWorkspaceSteps: (steps: WorkspaceStep[]) => void;
  addWorkspaceStep: (step: WorkspaceStep) => void;
  removeWorkspaceStep: (id: number) => void;
  workspaceText: string; // Legacy for TTS
  setWorkspaceText: (text: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceSteps, setWorkspaceSteps] = useState<WorkspaceStep[]>([]);
  const [workspaceText, setWorkspaceText] = useState(""); // Legacy for TTS

  const addWorkspaceStep = (step: WorkspaceStep) => {
    setWorkspaceSteps(prev => [...prev, step]);
  };
  
  const removeWorkspaceStep = (id: number) => {
    setWorkspaceSteps(prev => prev.filter(step => step.id !== id));
  }

  const contextValue = {
    workspaceSteps,
    setWorkspaceSteps,
    addWorkspaceStep,
    removeWorkspaceStep,
    workspaceText,
    setWorkspaceText,
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
