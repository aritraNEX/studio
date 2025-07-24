
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

  const getFirstName = (displayName: string | null) => {
    if (!displayName) return "User";
    return displayName.split(" ")[0];
  };

  const firstName = getFirstName(user.displayName);

  return (
    <div
      className={cn(
        "fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-[90%] transition-all duration-500 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full"
      )}
    >
      <div className="relative flex items-center gap-4 rounded-full bg-gradient-to-r from-primary to-accent p-4 pl-6 pr-10 shadow-2xl shadow-primary/30 text-white">
        <Sparkles className="h-6 w-6 flex-shrink-0 animate-pulse" />
        <p className="text-md sm:text-lg font-semibold whitespace-nowrap">
          Welcome {firstName}, we are setting up your workspace!
        </p>
        <button
          onClick={handleClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}
