
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send, User, Paperclip, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generalChat } from "@/ai/flows/general-chat-flow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";

interface Message {
  role: 'user' | 'ai';
  content: string;
  fileUrl?: string;
}

const VesperIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
);

const LoaderIcon = () => (
    <div className="flex items-center justify-center space-x-1">
        <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce"></div>
    </div>
);


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
            setFilePreview(event.target?.result as string);
        }
        reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = () => {
    const finalInput = input.trim();
    if (!finalInput && !file) return;

    const sendMessageWithFile = (dataUri?: string) => {
        const userMessage: Message = { role: 'user', content: finalInput, fileUrl: dataUri };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";

        startTransition(async () => {
            try {
                const result = await generalChat({ query: finalInput, fileUrl: dataUri });
                if (result && result.answer) {
                const aiMessage: Message = { role: 'ai', content: result.answer };
                setMessages(prev => [...prev, aiMessage]);
                } else {
                throw new Error("The AI returned an empty response.");
                }
            } catch (e: any) {
                console.error(e);
                let errorMessage = e.message || "Failed to get a response from the AI. Please try again.";
                // Don't throw a hard error, instead show it in the chat
                if (e.message?.includes('The AI model is currently busy')) {
                    errorMessage = e.message;
                }
                const aiErrorMessage: Message = { role: 'ai', content: errorMessage };
                setMessages(prev => [...prev, aiErrorMessage]);
            }
        });
    }
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            sendMessageWithFile(e.target?.result as string);
        }
        reader.readAsDataURL(file);
    } else {
        sendMessageWithFile();
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4 sm:p-8">
        <Card className="w-full max-w-4xl h-[90vh] shadow-2xl shadow-primary/20 rounded-2xl bg-card/60 backdrop-blur-xl border-border/20 flex flex-col animate-sparkle">
            <CardHeader className="flex-row items-center justify-between border-b relative z-10">
                <div className="flex items-center gap-4">
                     <Avatar className="h-12 w-12 border-2 border-primary/50">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            <VesperIcon />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Chat with Vesper
                        </CardTitle>
                        <CardDescription className="text-md text-muted-foreground/80">
                            Your friendly AI companion. Ask me anything!
                        </CardDescription>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Toolkit
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative z-10">
                <ScrollArea ref={scrollAreaRef} className="h-full p-6">
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground pt-20">
                                <VesperIcon />
                                <p className="text-lg font-semibold mt-4">Start a conversation!</p>
                                <p className="text-sm">You can ask me questions or upload an image.</p>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'ai' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            <VesperIcon />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`max-w-xl rounded-xl p-4 whitespace-pre-wrap ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {message.fileUrl && (
                                        <div className="mb-2">
                                            <Image src={message.fileUrl} alt="Uploaded file" width={200} height={200} className="rounded-lg object-contain" />
                                        </div>
                                    )}
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
                                        <VesperIcon />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="max-w-xl rounded-xl p-4 bg-muted">
                                    <LoaderIcon />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <div className="border-t p-4 relative z-10">
                 {filePreview && (
                    <div className="relative w-fit mb-2 p-2 border rounded-lg bg-muted">
                        <Image src={filePreview} alt="File preview" width={80} height={80} className="rounded-md object-cover" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                            onClick={handleRemoveFile}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                 )}
                 <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="chat-file-upload" />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute left-2 top-1/2 -translate-y-1/2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                    >
                       <Paperclip className="h-5 w-5" />
                    </Button>
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
                        className="pl-12 pr-16 resize-none"
                        rows={1}
                        disabled={isPending}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={handleSendMessage}
                        disabled={(!input.trim() && !file) || isPending}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </Card>
    </div>
  );
}
