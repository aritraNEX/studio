
"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { cn } from "@/lib/utils";

interface WelcomeBannerProps {
  user: User | null;
}

export default function WelcomeBanner({ user }: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState("");

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
    }
  }, [user]);

  if (!greeting) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full text-center py-4 animate-in fade-in-0 slide-in-from-top-10 duration-1000"
      )}
    >
      <h2 className="text-3xl md:text-4xl font-medium text-white/90">{greeting}</h2>
    </div>
  );
}
