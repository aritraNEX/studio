
"use client"

import * as React from "react"
import { Moon, Sun, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<"theme-light" | "dark" | "system">("system");
  const [isEyeProtectionOn, setEyeProtection] = React.useState(false);

  React.useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("texio-theme") as "theme-light" | "dark" | "system" | null;
      const savedEyeProtection = localStorage.getItem("texio-eye-protection") === "true";

      if (savedTheme) {
        setThemeState(savedTheme);
      }
      setEyeProtection(savedEyeProtection);
    } catch (error) {
        console.warn("Could not read theme settings from localStorage", error);
    }
  }, []);

  const setTheme = (newTheme: "theme-light" | "dark" | "system") => {
    setThemeState(newTheme);
    try {
        localStorage.setItem("texio-theme", newTheme);
    } catch (error) {
        console.warn("Could not save theme to localStorage", error);
    }
  }

  const toggleEyeProtection = () => {
    setEyeProtection(prev => {
        const newState = !prev;
        try {
            localStorage.setItem("texio-eye-protection", String(newState));
        } catch (error) {
            console.warn("Could not save eye protection state to localStorage", error);
        }
        return newState;
    });
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
        <DropdownMenuItem onClick={() => setTheme("theme-light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleEyeProtection}>
           {isEyeProtectionOn ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            <span>Eye Protection</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
