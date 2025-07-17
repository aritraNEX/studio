
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface SubscriptionContextType {
  isPremium: boolean;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for authentication to resolve

    if (user) {
      // User is logged in, check their subscription status from Firestore
      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().isPremium === true) {
          setIsPremium(true);
        } else {
          setIsPremium(false);
        }
        setLoading(false);
      }, (error) => {
        console.error("Failed to listen to user subscription status:", error);
        setIsPremium(false);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // User is not logged in, they are on the free plan by default
      setIsPremium(false);
      setLoading(false);
    }
  }, [user, authLoading]);

  // While loading subscription status, we can show a loader or nothing
  if (loading) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SubscriptionContext.Provider value={{ isPremium, loading }}>
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
