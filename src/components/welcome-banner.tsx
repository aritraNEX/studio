
"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { cn } from "@/lib/utils";
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
        setGreeting(`${timeGreeting}${firstName}`);
        
        const isFirstTimeUser = searchParams.get('welcome') === 'true';
        setWelcomeMessage(isFirstTimeUser ? 'Welcome!' : 'Welcome back!');
    }
  }, [user, searchParams]);

  return (
    <div
      className={cn(
        "w-full text-center py-4"
      )}
    >
        {greeting && <h2 className="text-3xl md:text-4xl font-medium text-foreground">{greeting}</h2>}
        {!greeting && <h2 className="text-3xl md:text-4xl font-medium text-foreground">{t('login_welcome_title')}</h2>}
        {welcomeMessage && <p className="text-lg text-muted-foreground mt-1">{welcomeMessage}</p>}
    </div>
  );
}
