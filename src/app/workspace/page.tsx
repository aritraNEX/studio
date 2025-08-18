
"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { IWorkspace, IMessage, getWorkspaceMessages, sendMessage } from '@/lib/workspace-utils';
import { CreateWorkspace } from '@/components/workspace/create-workspace';
import { MembersDialog } from '@/components/workspace/members-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '../ui/use-toast';

export default function WorkspacePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<IWorkspace | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    const workspacesQuery = query(
        collection(db, 'workspaces'), 
        where(`memberUids.${user.uid}`, '==', true)
    );
    
    const unsubscribeWorkspaces = onSnapshot(workspacesQuery, (snapshot) => {
        const userWorkspaces = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as IWorkspace)
        );
        setWorkspaces(userWorkspaces);
        if (!activeWorkspace && userWorkspaces.length > 0) {
            setActiveWorkspace(userWorkspaces[0]);
        } else if (activeWorkspace) {
            // Refresh active workspace data if it changed
            const updatedActive = userWorkspaces.find(w => w.id === activeWorkspace.id);
            setActiveWorkspace(updatedActive || null);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
    });

    return () => unsubscribeWorkspaces();
  }, [user, router, activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      const messagesQuery = query(
        collection(db, 'workspaces', activeWorkspace.id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const workspaceMessages = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as IMessage)
        );
        setMessages(workspaceMessages);
      });
      return () => unsubscribeMessages();
    }
  }, [activeWorkspace]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !activeWorkspace || !newMessage.trim()) return;

    try {
        await sendMessage(activeWorkspace.id, newMessage, user);
        setNewMessage('');
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: "Failed to send message" });
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return <CreateWorkspace />;
  }
  
  if (!user) {
    return null; // Should be redirected
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/40">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div>
                <h1 className="text-xl font-bold">{activeWorkspace.name}</h1>
                <p className="text-sm text-muted-foreground">{activeWorkspace.description || 'Collaborate with your team.'}</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsMembersDialogOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Members
                </Button>
            </div>
        </header>

        <main className="flex-1 flex flex-col p-6 overflow-hidden">
            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-6">
                    {messages.map(message => (
                        <div key={message.id} className={cn("flex items-start gap-3", message.sender.uid === user.uid ? "justify-end" : "justify-start")}>
                           {message.sender.uid !== user.uid && (
                               <Avatar className="h-8 w-8">
                                    <AvatarImage src={message.sender.photoURL || ''} />
                                    <AvatarFallback>{message.sender.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                           )}
                           <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2", message.sender.uid === user.uid ? "bg-primary text-primary-foreground" : "bg-background")}>
                                <p className="text-sm font-semibold">{message.sender.displayName}</p>
                                <p className="whitespace-pre-wrap">{message.text}</p>
                                <p className="text-xs text-right opacity-70 mt-1">
                                    {message.createdAt ? formatDistanceToNow(new Date(message.createdAt.seconds * 1000), { addSuffix: true }) : 'sending...'}
                                </p>
                           </div>
                           {message.sender.uid === user.uid && (
                               <Avatar className="h-8 w-8">
                                    <AvatarImage src={message.sender.photoURL || ''} />
                                    <AvatarFallback>{message.sender.displayName?.[0]}</AvatarFallback>
                                </Avatar>
                           )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            <div className="mt-4 flex items-center gap-2">
                 <Textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </main>
        
        <MembersDialog
            workspace={activeWorkspace}
            open={isMembersDialogOpen}
            onOpenChange={setIsMembersDialogOpen}
        />
    </div>
  );
}
