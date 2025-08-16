
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  setWorkspaceSteps: React.Dispatch<React.SetStateAction<WorkspaceStep[]>>;
  addWorkspaceStep: (step: WorkspaceStep) => void;
  removeWorkspaceStep: (id: number) => void;
  workspaceText: string; 
  setWorkspaceText: (text: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceSteps, setWorkspaceSteps] = useState<WorkspaceStep[]>(() => {
    // Lazy initialization from localStorage
    if (typeof window !== 'undefined') {
        const savedSteps = localStorage.getItem('workspaceSteps');
        return savedSteps ? JSON.parse(savedSteps) : [];
    }
    return [];
  });
  
  const [workspaceText, setWorkspaceText] = useState("");

  useEffect(() => {
    // Persist steps to localStorage whenever they change
     if (typeof window !== 'undefined') {
        localStorage.setItem('workspaceSteps', JSON.stringify(workspaceSteps));
     }
  }, [workspaceSteps]);

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

