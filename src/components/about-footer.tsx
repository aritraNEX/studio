"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AboutFooter() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  }

  return (
    <footer className="w-full mt-8 p-6 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h3 className="font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            About Vesper
          </h3>
          <p className="text-sm text-muted-foreground">
            Vesper is your ultimate AI-powered toolkit, designed to enhance your productivity and creativity. From writing assistance to media processing, Vesper has a comprehensive suite of tools to help you achieve more.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-2">Quick Links</h3>
          <ul className="text-sm space-y-1">
            <li><a onClick={() => handleNavigate('/dashboard')} className="text-muted-foreground hover:text-primary cursor-pointer">My Projects</a></li>
            <li><a onClick={() => handleNavigate('/integrations')} className="text-muted-foreground hover:text-primary cursor-pointer">Integrations</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-2">Legal</h3>
           <ul className="text-sm space-y-1">
            <li><a onClick={() => handleNavigate('/privacy')} className="text-muted-foreground hover:text-primary cursor-pointer">Privacy Policy</a></li>
            <li><a onClick={() => handleNavigate('/terms')} className="text-muted-foreground hover:text-primary cursor-pointer">Terms of Service</a></li>
            <li>
                <Link href="/admin" className="text-muted-foreground hover:text-primary cursor-pointer">Admin</Link>
            </li>
          </ul>
        </div>
      </div>
       <div className="text-center text-xs text-muted-foreground mt-8 border-t border-border pt-4">
        &copy; {new Date().getFullYear()} Vesper. All rights reserved.
      </div>
    </footer>
  );
}
