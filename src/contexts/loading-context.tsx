
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from "react";

interface LoadingContextType {
    startLoading: () => void;
    stopLoading: () => void;
    isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
};

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const startLoading = useCallback(() => setLoadingCount(c => c + 1), []);
  const stopLoading = useCallback(() => setLoadingCount(c => Math.max(c - 1, 0)), []);
  const isLoading = loadingCount > 0;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loadingCount > 0) {
      if (progress === 0) setProgress(20); // Start instantly if not already running
      timer = setInterval(() => {
        setProgress(p => (p < 90 ? p + Math.random() * 5 : p));
      }, 200);
    } else if (loadingCount === 0 && progress > 0) {
      setProgress(100);
      setTimeout(() => setProgress(0), 300); // Complete animation then hide
    }
    return () => clearInterval(timer);
  }, [loadingCount, progress]);

  // Global fetch interceptor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      startLoading();
      try {
        return await originalFetch(...args);
      } finally {
        stopLoading();
      }
    };
    return () => { window.fetch = originalFetch; };
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          width: `${progress}%`,
          background: "linear-gradient(90deg,#8b5cf6,#ec4899)",
          boxShadow: "0 0 10px #8b5cf6, 0 0 5px #ec4899",
          transition: "width 0.2s ease, opacity 0.3s ease",
          opacity: progress > 0 ? 1 : 0,
          zIndex: 9999,
        }}
      />
    </LoadingContext.Provider>
  );
};
