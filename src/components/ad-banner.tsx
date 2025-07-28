
"use client";

import { Megaphone } from 'lucide-react';

export default function AdBanner() {
  return (
    <div className="my-6">
      <div className="flex items-center justify-center w-full h-24 bg-muted/50 border border-dashed rounded-lg">
        <div className="text-center text-muted-foreground">
            <Megaphone className="mx-auto h-6 w-6 mb-2" />
            <p className="text-sm font-medium">Ad Placeholder</p>
            <p className="text-xs">Your ad will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}
