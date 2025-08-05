
"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";

interface WelcomeBannerProps {
  user: User;
}

export default function WelcomeBanner({ user }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);

    // Automatically hide after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Remove the query param from URL without reloading page after animation out
    setTimeout(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('welcome');
        router.replace(`?${newParams.toString()}`, { scroll: false });
    }, 300);
  };

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
    if (!displayName) return "User";
    return displayName.split(" ")[0];
  };

  const firstName = getFirstName(user.displayName);
  const timeGreeting = getGreeting();

  return (
    <div
      className={cn(
        "fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[90%] transition-all duration-500 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full"
      )}
    >
      <div className="relative flex items-center gap-2 sm:gap-4 rounded-full bg-gradient-to-r from-primary to-accent p-3 sm:p-4 sm:pl-6 sm:pr-10 shadow-2xl shadow-primary/30 text-white">
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 animate-pulse" />
        <p className="text-sm sm:text-lg font-semibold text-center">
          {`${timeGreeting}, ${firstName}!`}
        </p>
        <button
          onClick={handleClose}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}
