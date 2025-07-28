
"use client";

import { Sparkles, Users, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AboutFooter() {
  const router = useRouter();

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
            <li><a onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-primary cursor-pointer">My Projects</a></li>
            <li><a onClick={() => router.push('/groups')} className="text-muted-foreground hover:text-primary cursor-pointer">Collaboration Groups</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-2">Legal</h3>
           <ul className="text-sm space-y-1">
            <li><a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a></li>
            <li><a href="#" className="text-muted-foreground hover:text-primary">Terms of Service</a></li>
          </ul>
        </div>
      </div>
       <div className="text-center text-xs text-muted-foreground mt-8 border-t border-border pt-4">
        &copy; {new Date().getFullYear()} Vesper. All rights reserved.
      </div>
    </footer>
  );
}
