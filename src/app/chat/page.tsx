
"use client";

import { AssignmentMakerTab } from "@/components/assignment-maker-tab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8">
        <Card className="w-full max-w-6xl shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Assign-mentor Chat
                    </CardTitle>
                    <CardDescription className="text-md text-muted-foreground/80">
                        Your AI-powered academic assistant.
                    </CardDescription>
                </div>
                <Button asChild variant="outline">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Back to Toolkit
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="p-2 sm:p-8 pt-2">
                <AssignmentMakerTab />
            </CardContent>
        </Card>
    </div>
  );
}
