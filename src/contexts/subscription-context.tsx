
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
  const [isPremium, setIsPremium] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(true); // Default to true
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsPremium(data.isPremium === true);
          setHasUsedTrial(data.hasUsedTrial === true);
        } else {
          // Document might not exist yet for new user, defaults are fine
          setIsPremium(false);
          setHasUsedTrial(false);
        }
        setLoading(false);
      }, (error) => {
        console.error("Failed to listen to user subscription status:", error);
        setIsPremium(false);
        setHasUsedTrial(true);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Not logged in, no premium, no trial
      setIsPremium(false);
      setHasUsedTrial(true);
      setLoading(false);
    }
  }, [user, authLoading]);

  const makePremium = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { isPremium: true });
    setIsPremium(true); // Update local state immediately
  };

  if (loading) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
