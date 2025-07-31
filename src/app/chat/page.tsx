"use client";

import { useState, useRef, useEffect } from "react";
import { Send, User, Paperclip, X, Home, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  fileUrl?: string;
  isStreaming?: boolean;
}

const VesperIcon = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-background"
        >
        <circle cx="40" cy="40" r="30" className="fill-primary" />
        <circle cx="70" cy="35" r="20" className="fill-primary/70" />
        <circle cx="65" cy="75" r="25" className="fill-accent" />
        <circle cx="80" cy="70" r="10" className="fill-primary" />
    </svg>
);

const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-2">
        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
    </div>
);


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
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

  const handleSendMessage = async () => {
    const finalInput = input.trim();
    if (!finalInput && !file) return;

    setIsPending(true);

    let dataUri: string | undefined;
    if (file) {
      dataUri = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: finalInput, fileUrl: dataUri };
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = { id: aiMessageId, role: 'ai', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInput("");
    setFile(null);
    setFilePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";

    try {
      const response = await fetch('/api/ai/stream/generalChat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: finalInput, fileUrl: dataUri }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "An error occurred during the request.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: msg.content + chunk } : msg
          ));
      }
      
    } catch (e: any) {
        console.error(e);
        const errorMessage = e.message || "Failed to get a response from the AI.";
        setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: `Error: ${errorMessage}`, isStreaming: false } : msg
          ));
    } finally {
        setIsPending(false);
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
        ));
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background overflow-hidden">
       <Image
          src="/hero-grid.svg"
          alt="background"
          fill
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute top-4 right-4 z-20">
            <Button asChild variant="outline" size="sm">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Toolkit
                </Link>
            </Button>
        </div>
        <div className="w-full max-w-4xl flex-1 flex flex-col p-4 sm:p-6 z-10">
            <header className="mb-6 text-center">
                <div className="inline-block p-3 bg-primary rounded-full mb-4 shadow-lg">
                    <VesperIcon />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Chat with Vesper</h1>
                <p className="mt-2 text-md text-muted-foreground">Your friendly AI companion. Ask me anything!</p>
            </header>

             <div ref={scrollAreaRef} className="flex-1 overflow-y-auto pr-4 -mr-4 mb-4">
                <div className="space-y-6">
                    {messages.map((message) => (
                        <div key={message.id} className={cn("flex items-end gap-3", message.role === 'user' ? 'justify-end' : '')}>
                            {message.role === 'ai' && (
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <VesperIcon />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn("max-w-xl rounded-2xl p-4", message.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground border rounded-bl-none')}>
                                {message.fileUrl && message.content && (
                                    <div className="mb-2">
                                        <Image src={message.fileUrl} alt="Uploaded file" width={200} height={200} className="rounded-lg object-contain" />
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                                    {message.content}
                                    {message.isStreaming && <TypingIndicator />}
                                </div>
                            </div>
                             {message.role === 'user' && (
                                <Avatar className="h-8 w-8 shrink-0">
                                     <AvatarImage src={user?.photoURL ?? ''} />
                                     <AvatarFallback>
                                         {user?.email?.[0].toUpperCase() ?? <User />}
                                     </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {messages.length === 0 && !isPending && (
                        <div className="text-center text-muted-foreground pt-20">
                            <Sparkles className="mx-auto h-12 w-12 text-primary/30" />
                            <p className="text-lg font-semibold mt-4">Start a conversation!</p>
                            <p className="text-sm">You can ask me questions or upload an image.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-4 bg-background/80 backdrop-blur-sm rounded-t-xl">
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
                 <div className="relative rounded-lg border bg-card focus-within:ring-2 focus-within:ring-primary transition-all">
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
                        className="pl-12 pr-16 py-3 resize-none border-none focus-visible:ring-0 bg-transparent shadow-none"
                        rows={1}
                        disabled={isPending}
                    />
                     <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="chat-file-upload" />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPending}
                            className="text-muted-foreground hover:text-primary"
                        >
                           <Paperclip className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Button
                            type="submit"
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={(!input.trim() && !file) || isPending}
                        >
                            {isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}