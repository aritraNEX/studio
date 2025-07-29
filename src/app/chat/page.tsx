
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, User, Sparkles, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generalChat } from "@/ai/flows/general-chat-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      try {
        const result = await generalChat({ query: input });
        if (result && result.answer) {
          const aiMessage: Message = { role: 'ai', content: result.answer };
          setMessages(prev => [...prev, aiMessage]);
        } else {
          throw new Error("The AI returned an empty response.");
        }
      } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || "Failed to get a response from the AI. Please try again.";
        const aiErrorMessage: Message = { role: 'ai', content: errorMessage };
        setMessages(prev => [...prev, aiErrorMessage]);
      }
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8">
        <Card className="w-full max-w-4xl h-[90vh] shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20 flex flex-col">
            <CardHeader className="flex-row items-center justify-between border-b">
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Vesper Chat
                    </CardTitle>
                    <CardDescription className="text-md text-muted-foreground/80">
                        Your personal AI assistant. Ask me anything!
                    </CardDescription>
                </div>
                <Button asChild variant="outline">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Toolkit
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea ref={scrollAreaRef} className="h-full p-6">
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground pt-20">
                                <Sparkles className="h-16 w-16 mx-auto text-primary/50 mb-4" />
                                <p className="text-lg">Start a conversation!</p>
                                <p className="text-sm">Chat with Vesper, your AI assistant.</p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'ai' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            <Sparkles className="h-5 w-5"/>
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-xl rounded-xl p-4 whitespace-pre-wrap ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {message.content}
                                </div>
                                 {message.role === 'user' && (
                                    <Avatar className="h-8 w-8">
                                         <AvatarImage src={user?.photoURL ?? ''} />
                                         <AvatarFallback>
                                             {user?.email?.[0].toUpperCase() ?? <User />}
                                         </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}
                        {isPending && (
                            <div className="flex items-start gap-4">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <Sparkles className="h-5 w-5"/>
                                    </AvatarFallback>
                                </Avatar>
                                <div className="max-w-xl rounded-xl p-4 bg-muted">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <div className="border-t p-4">
                 <div className="relative">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Type your message here..."
                        className="pr-16 resize-none"
                        rows={1}
                        disabled={isPending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isPending}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </Card>
    </div>
  );
}
