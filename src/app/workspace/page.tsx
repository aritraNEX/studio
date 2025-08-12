
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ArrowLeft, Users, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Member {
    uid: string;
    email: string;
    name: string;
    role: 'Owner' | 'Editor' | 'Viewer';
    photoURL?: string;
}

interface Group {
    id: string;
    name: string;
    members: Member[];
}

export default function WorkspacePage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get('projectId');
    const { toast } = useToast();

    const [content, setContent] = useState('');
    const [projectData, setProjectData] = useState<any>(null);
    const [groupData, setGroupData] = useState<Group | null>(null);
    const [isSaving, startSavingTransition] = useTransition();
    const [loading, setLoading] = useState(true);

    const currentUserRole = groupData?.members.find(m => m.uid === user?.uid)?.role;
    const canEdit = projectData?.groupId ? (currentUserRole === 'Owner' || currentUserRole === 'Editor') : (projectData?.userId === user?.uid);

    useEffect(() => {
        if (!projectId || !user) {
            if(!user) router.push('/login');
            else if(!projectId) router.push('/dashboard');
            return;
        }

        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribeProject = onSnapshot(projectDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProjectData(data);
                setContent(data.outputText || '');
                
                // Fetch group data if it's a group project
                if (data.groupId) {
                    const groupDocRef = doc(db, 'groups', data.groupId);
                    const groupSnap = await getDoc(groupDocRef);
                    if (groupSnap.exists()) {
                        const group = { id: groupSnap.id, ...groupSnap.data() } as Group;
                        // Security check: is user part of this group?
                        if (group.members.some(m => m.uid === user.uid)) {
                            setGroupData(group);
                        } else {
                             toast({ variant: 'destructive', title: "Access Denied" });
                             router.push('/dashboard');
                        }
                    }
                } else {
                    // It's a personal project, check ownership
                    if (data.userId !== user.uid) {
                        toast({ variant: 'destructive', title: "Access Denied" });
                        router.push('/dashboard');
                    }
                }
            } else {
                toast({ variant: 'destructive', title: 'Project not found' });
                router.push('/dashboard');
            }
            setLoading(false);
        });

        return () => unsubscribeProject();
    }, [projectId, user, router, toast]);

    const handleSave = () => {
        if (!projectId || !canEdit) return;
        startSavingTransition(async () => {
            const projectDocRef = doc(db, 'projects', projectId);
            try {
                await updateDoc(projectDocRef, {
                    outputText: content,
                    lastEditedAt: serverTimestamp(),
                    lastEditedBy: user?.uid,
                });
                toast({ title: 'Document Saved!' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Failed to save document' });
            }
        });
    };

    if (loading) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="flex items-center justify-between p-3 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2"><FileText className="h-5 w-5"/>{projectData?.inputText || 'Untitled Document'}</h1>
                        {groupData && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3"/>{groupData.name}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {groupData && (
                        <div className="flex -space-x-2 overflow-hidden">
                            <TooltipProvider>
                                {groupData.members.map(member => (
                                    <Tooltip key={member.uid}>
                                        <TooltipTrigger>
                                            <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                                                <AvatarImage src={member.photoURL} />
                                                <AvatarFallback>{member.name?.[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{member.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                             </TooltipProvider>
                        </div>
                    )}
                    <Button onClick={handleSave} disabled={isSaving || !canEdit}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your collaborative document..."
                    className="w-full h-full resize-none border-none focus-visible:ring-0 text-base p-4"
                    disabled={isSaving || !canEdit}
                />
            </main>
        </div>
    );
}
