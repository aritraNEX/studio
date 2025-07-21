
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface SubscriptionContextType {
  isPremium: boolean;
  loading: boolean;
  makePremium: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(true); // Default to true now
  const [loading, setLoading] = useState(false); // No need to load subscription status

  const makePremium = async () => {
    // This function is now a no-op as everything is free.
    return Promise.resolve();
  };

  return (
    <SubscriptionContext.Provider value={{ isPremium, loading, makePremium }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
