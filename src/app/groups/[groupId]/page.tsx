
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Home, Trash2, Edit, Users, UserPlus, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Member {
    uid: string;
    email: string;
    name: string;
    role: 'Owner' | 'Editor' | 'Viewer';
}

interface Group {
    id: string;
    name: string;
    ownerId: string;
    members: Member[];
    memberIds: string[];
}

interface Project {
  id: string;
  inputText: string;
  outputText: string;
  operation: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export default function GroupDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const currentUserRole = group?.members.find(m => m.uid === user?.uid)?.role;

  useEffect(() => {
    if (!groupId || !user) return;

    const groupDocRef = doc(db, 'groups', groupId);
    const unsubscribeGroup = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const groupData = { id: docSnap.id, ...docSnap.data() } as Group;
        if (!groupData.memberIds.includes(user.uid)) {
            toast({ variant: 'destructive', title: "Access Denied" });
            router.push('/groups');
            return;
        }
        setGroup(groupData);
      } else {
        toast({ variant: 'destructive', title: "Group not found" });
        router.push('/groups');
      }
      setLoading(false);
    });

    const projectsQuery = query(collection(db, 'projects'), where('groupId', '==', groupId), orderBy('createdAt', 'desc'));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });

    return () => {
      unsubscribeGroup();
      unsubscribeProjects();
    };
  }, [groupId, user, router, toast]);

  const handleInviteMember = async () => {
      if (!inviteEmail.trim() || !group) return;
      setIsInviting(true);
      // In a real app, you'd use a Cloud Function to look up user by email.
      // Here we'll simulate by checking if a user with this email exists.
      // This is insecure on the client, but demonstrates the flow.
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", inviteEmail));
      const querySnapshot = await getDoc(q);

      // This part is a simplification. A real implementation would use a server-side function
      // to find the user by email without exposing user data to the client.
      toast({ variant: 'destructive', title: 'Cannot find user by email', description: 'This is a demo. Please manually ensure the user exists.' });
      setIsInviting(false);
      setInviteDialogOpen(false);
  };
  
  const handleRemoveMember = async (memberToRemoveId: string) => {
      if (!group) return;
      try {
          const groupRef = doc(db, 'groups', group.id);
          const memberToRemove = group.members.find(m => m.uid === memberToRemoveId);
          await updateDoc(groupRef, {
              members: arrayRemove(memberToRemove),
              memberIds: arrayRemove(memberToRemoveId)
          });
          toast({ title: 'Member removed' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to remove member' });
      }
  };
  
  const handleRoleChange = async (memberId: string, newRole: Member['role']) => {
      if (!group) return;
      try {
          const groupRef = doc(db, 'groups', group.id);
          const updatedMembers = group.members.map(m => m.uid === memberId ? { ...m, role: newRole } : m);
          await updateDoc(groupRef, { members: updatedMembers });
          toast({ title: 'Role updated' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to update role' });
      }
  };

  const handleCreateProject = async () => {
      if (!group) return;
      try {
          const newProjectRef = await addDoc(collection(db, 'projects'), {
              groupId: group.id,
              userId: user?.uid, // creator
              inputText: 'New Project',
              outputText: '',
              operation: 'document',
              createdAt: serverTimestamp(),
          });
          router.push(`/workspace?projectId=${newProjectRef.id}`); // Or a new editor page
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to create project' });
      }
  }


  if (loading || authLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
           </div>;
  }

  if (!group) {
    return <div className="text-center p-8">Group not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/groups')}><ArrowLeft className="h-4 w-4"/></Button>
                    <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
                </div>
                 <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                        {currentUserRole === 'Owner' && <Button><UserPlus className="mr-2 h-4 w-4"/>Invite</Button>}
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a new member</DialogTitle>
                            <DialogDescription>Enter the email address of the person you want to invite.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@example.com" />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail.trim()}>
                                {isInviting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Send Invite
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Group Projects</CardTitle>
                        <CardDescription>Projects shared within this group.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {projects.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No projects yet. Create one!</p>
                                <Button onClick={handleCreateProject} className="mt-4">Create First Project</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Project cards would go here */}
                                {projects.map(p => (
                                    <Card key={p.id}>
                                        <CardHeader><CardTitle>{p.operation}</CardTitle></CardHeader>
                                        <CardContent><p className="line-clamp-2">{p.inputText}</p></CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Members ({group.members.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {group.members.map(member => (
                            <div key={member.uid} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                {currentUserRole === 'Owner' && member.uid !== user?.uid ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleRoleChange(member.uid, 'Editor')}>Set as Editor</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleRoleChange(member.uid, 'Viewer')}>Set as Viewer</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onSelect={() => handleRemoveMember(member.uid)}>Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Badge variant="secondary">{member.role}</Badge>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}

