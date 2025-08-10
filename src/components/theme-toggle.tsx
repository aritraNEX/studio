
"use client"

import * as React from "react"
import { Moon, Sun, Eye, EyeOff, Sparkles, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useSound } from "@/contexts/sound-context"

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<"theme-light" | "dark" | "system">("dark"); // Default to dark
  const [isEyeProtectionOn, setEyeProtection] = React.useState(false);
  const [animationsEnabled, setAnimationsEnabled] = React.useState(false);
  const { soundEnabled, setSoundEnabled } = useSound();

  React.useEffect(() => {
    try {
      // Keep theme logic but remove user's ability to change it. Default to dark.
      const savedEyeProtection = localStorage.getItem("texio-eye-protection") === "true";
      const savedAnimations = localStorage.getItem("texio-animations-enabled") === "true";

      setEyeProtection(savedEyeProtection);
      setAnimationsEnabled(savedAnimations);
    } catch (error) {
        console.warn("Could not read settings from localStorage", error);
    }
  }, []);

  const toggleEyeProtection = (checked: boolean) => {
    setEyeProtection(checked);
    try {
        localStorage.setItem("texio-eye-protection", String(checked));
    } catch (error) {
        console.warn("Could not save eye protection state to localStorage", error);
    }
  }
  
  const toggleAnimations = (checked: boolean) => {
    try {
        localStorage.setItem("texio-animations-enabled", String(checked));
        setAnimationsEnabled(checked);
        // Force a reload to apply or remove the animation class from the root layout
        window.location.reload();
    } catch (error) {
        console.warn("Could not save animations state to localStorage", error);
    }
  }

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList[isDark ? "add" : "remove"]("dark");

    const existingFilter = document.querySelector('.eye-protection-filter');
    if (isEyeProtectionOn) {
        if (!existingFilter) {
            const filterDiv = document.createElement('div');
            filterDiv.className = 'eye-protection-filter';
            filterDiv.style.position = 'fixed';
            filterDiv.style.top = '0';
            filterDiv.style.left = '0';
            filterDiv.style.width = '100vw';
            filterDiv.style.height = '100vh';
            filterDiv.style.pointerEvents = 'none';
            filterDiv.style.zIndex = '9999';
            filterDiv.style.backgroundColor = 'rgba(240, 190, 100, 0.1)';
            document.body.appendChild(filterDiv);
        }
    } else {
        if (existingFilter) {
            document.body.removeChild(existingFilter);
        }
    }
  }, [theme, isEyeProtectionOn]);


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm outline-none">
            <div className="flex items-center justify-between">
                <Label htmlFor="eye-protection-switch" className="flex items-center gap-2 cursor-pointer font-normal">
                    {isEyeProtectionOn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>Eye Protection</span>
                </Label>
                <Switch id="eye-protection-switch" checked={isEyeProtectionOn} onCheckedChange={toggleEyeProtection} />
            </div>
        </div>
        <div className="px-2 py-1.5 text-sm outline-none">
            <div className="flex items-center justify-between">
                <Label htmlFor="animations-switch" className="flex items-center gap-2 cursor-pointer font-normal">
                    <Sparkles className="h-4 w-4" />
                    <span>Animations</span>
                </Label>
                <Switch id="animations-switch" checked={animationsEnabled} onCheckedChange={toggleAnimations} />
            </div>
        </div>
        <div className="px-2 py-1.5 text-sm outline-none">
            <div className="flex items-center justify-between">
                <Label htmlFor="sound-switch" className="flex items-center gap-2 cursor-pointer font-normal">
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    <span>Sound Effects</span>
                </Label>
                <Switch id="sound-switch" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
