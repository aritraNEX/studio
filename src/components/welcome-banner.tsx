"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useLanguage } from "@/contexts/language-context";
import { useSearchParams } from "next/navigation";

interface WelcomeBannerProps {
  user: User | null;
}

export default function WelcomeBanner({ user }: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  useEffect(() => {
    const getGreetingText = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return "Good morning";
      } else if (hour >= 12 && hour < 18) {
        return "Good afternoon";
      } else {
        return "Good evening";
      }
    };

    const getFirstName = (displayName: string | null | undefined) => {
      if (!displayName) return "";
      return `, ${displayName.split(" ")[0]}`;
    };
    
    if (user) {
        const firstName = getFirstName(user.displayName);
        const timeGreeting = getGreetingText();
        setGreeting(`${timeGreeting}${firstName}`);
        
        const isFirstTimeUser = searchParams.get('welcome') === 'true';
        setSubtitle(isFirstTimeUser ? 'Welcome to Vesper!' : 'Welcome back!');
    } else {
        setGreeting(t('login_welcome_title'));
        setSubtitle(t('login_welcome_subtitle'));
    }
  }, [user, searchParams, t]);

  return (
    <div
      className="w-full text-center py-4 mb-4"
    >
        <h2 className="text-4xl md:text-5xl font-bold text-gradient">
            {greeting}
        </h2>
       
        <p className="text-lg text-muted-foreground mt-2">{subtitle}</p>
    </div>
  );
}
