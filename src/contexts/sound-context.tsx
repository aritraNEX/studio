
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (type: 'click') => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

let audioContext: AudioContext | null = null;
const isBrowser = typeof window !== 'undefined';

const initializeAudioContext = () => {
  if (isBrowser && (!audioContext || audioContext.state === 'suspended')) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
  if (audioContext?.state === 'suspended') {
      audioContext.resume();
  }
};

const playClickSound = () => {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
};


export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [soundEnabled, setSoundEnabledState] = useState(false);

  useEffect(() => {
    // This effect runs only on the client-side
    try {
      const savedSoundSetting = localStorage.getItem('vesper-sound-enabled') === 'true';
      setSoundEnabledState(savedSoundSetting);
       if (savedSoundSetting) {
          initializeAudioContext();
       }
    } catch (error) {
      console.warn("Could not read sound setting from localStorage", error);
    }

    // Add a global click listener to resume audio context on any user interaction
    const resumeAudio = () => {
        if (soundEnabled && audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);

    return () => {
        document.removeEventListener('click', resumeAudio);
    };

  }, [soundEnabled]);

  const setSoundEnabled = (enabled: boolean) => {
    try {
      localStorage.setItem('vesper-sound-enabled', String(enabled));
    } catch (error)      {
      console.warn("Could not save sound setting to localStorage", error);
    }
    setSoundEnabledState(enabled);
    if (enabled) {
      initializeAudioContext();
    }
  };

  const playSound = useCallback((type: 'click') => {
    if (soundEnabled && audioContext) {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      switch(type) {
        case 'click':
          playClickSound();
          break;
        default:
          break;
      }
    }
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, playSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
