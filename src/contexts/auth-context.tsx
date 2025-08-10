
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Extend the Firebase User type to include our custom fields
interface VesperUser extends User {
  bio?: string;
}

interface AuthContextType {
  user: VesperUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<VesperUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let docUnsubscribe: Unsubscribe | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (authUser) => {
      // If there's an existing doc listener, unsubscribe from it
      if (docUnsubscribe) {
        docUnsubscribe();
      }

      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        docUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            setUser({
              ...authUser,
              ...firestoreData,
            });
          } else {
            // Document might not exist yet for a new user, just set authUser
            setUser(authUser);
          }
          // Only stop loading after we've attempted to fetch the Firestore doc
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setUser(authUser); // Still set the auth user
          setLoading(false);
        });
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (docUnsubscribe) {
        docUnsubscribe();
      }
    };
  }, []);
  
  // This top-level loader ensures no part of the app renders until authentication is resolved.
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[200]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
