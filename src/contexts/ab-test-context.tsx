
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type UserGroup = 'A' | 'B';

interface ABTestContextType {
  group: UserGroup | null;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

export const ABTestProvider = ({ children }: { children: ReactNode }) => {
  const [group, setGroup] = useState<UserGroup | null>(null);

  useEffect(() => {
    // This effect runs only on the client-side
    let userGroup = localStorage.getItem('ab-test-group') as UserGroup;
    
    if (!userGroup) {
      // If no group is assigned, randomly assign one and save it
      userGroup = Math.random() < 0.5 ? 'A' : 'B';
      try {
        localStorage.setItem('ab-test-group', userGroup);
      } catch (error) {
        console.warn("Could not save A/B test group to localStorage", error);
      }
    }
    
    setGroup(userGroup);
  }, []);

  // While the group is being determined on the client, you can render children as-is
  // or show a loader, but for A/B testing, it's often fine to just let the default render
  // and then update once the group is known.
  return (
    <ABTestContext.Provider value={{ group }}>
      {children}
    </ABTestContext.Provider>
  );
};

export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  // Provide a default group 'A' if the context is not yet available to prevent errors during SSR
  return context || { group: 'A' };
};
