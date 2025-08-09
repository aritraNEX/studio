
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
    } else {
        setGreeting(t('login_welcome_title'));
        setWelcomeMessage(t('login_welcome_subtitle'));
    }
  }, [user, searchParams, t]);

  return (
    <div
      className={cn(
        "w-full text-center py-4"
      )}
    >
        <style>
        {`
        @keyframes river-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .text-gradient {
            background: linear-gradient(90deg, #FFC107, #F44336, #E91E63, #9C27B0, #FFC107);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
            animation: river-flow 10s ease-in-out infinite;
        }
        `}
        </style>

        {greeting && (
            <h2 className="text-3xl md:text-4xl font-bold text-gradient">
                {greeting}
            </h2>
        )}

        {welcomeMessage && user && <p className="text-lg text-muted-foreground mt-2">{welcomeMessage}</p>}
    </div>
  );
}
