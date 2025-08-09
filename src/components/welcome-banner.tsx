
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
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return "Good morning";
      } else if (hour >= 12 && hour < 18) {
        return "Good afternoon";
      } else {
        return "Good evening";
      }
    };

    const getFirstName = (displayName: string | null) => {
      if (!displayName) return "";
      return `, ${displayName.split(" ")[0]}`;
    };
    
    if (user) {
        const firstName = getFirstName(user.displayName);
        const timeGreeting = getGreeting();
        const finalGreeting = `${timeGreeting}${firstName}`;
        setGreeting(finalGreeting);
        
        const isFirstTimeUser = searchParams.get('welcome') === 'true';
        setWelcomeMessage(isFirstTimeUser ? 'Welcome!' : 'Welcome back!');
    } else {
        setGreeting(t('login_welcome_title'));
        setWelcomeMessage(t('login_welcome_subtitle'));
    }
  }, [user, searchParams, t]);

  return (
    <div
      className="w-full text-center py-4 mb-4"
    >
        <h2 className="text-4xl md:text-5xl font-bold text-gradient">
            {greeting}
        </h2>
       
        <p className="text-lg text-white/80 mt-2">{welcomeMessage}</p>
    </div>
  );
}
