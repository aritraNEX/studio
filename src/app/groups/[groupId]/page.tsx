
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Home, Trash2, Edit, Users, UserPlus, MoreVertical, ArrowLeft } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle } from 'lucide-react';

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
      
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", inviteEmail.trim()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: 'User not found', description: 'No user exists with this email address.' });
            return;
        }

        const invitedUserDoc = querySnapshot.docs[0];
        const invitedUserData = invitedUserDoc.data();
        
        if(group.memberIds.includes(invitedUserData.uid)) {
            toast({ variant: 'destructive', title: 'User already in group' });
            return;
        }

        const newMember: Member = {
            uid: invitedUserData.uid,
            email: invitedUserData.email,
            name: invitedUserData.displayName || invitedUserData.email,
            role: 'Viewer'
        };

        const groupRef = doc(db, 'groups', group.id);
        await updateDoc(groupRef, {
            members: arrayUnion(newMember),
            memberIds: arrayUnion(newMember.uid)
        });
        
        toast({ title: 'Member added!', description: `${newMember.email} has been added to the group.` });
        setInviteEmail("");
        setInviteDialogOpen(false);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Failed to invite member' });
      } finally {
        setIsInviting(false);
      }
  };
  
  const handleRemoveMember = async (memberToRemove: Member) => {
      if (!group || currentUserRole !== 'Owner' || memberToRemove.uid === group.ownerId) return;
      try {
          const groupRef = doc(db, 'groups', group.id);
          const memberData = group.members.find(m => m.uid === memberToRemove.uid);
          if (memberData) {
            await updateDoc(groupRef, {
                members: arrayRemove(memberData),
                memberIds: arrayRemove(memberToRemove.uid)
            });
            toast({ title: 'Member removed' });
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to remove member' });
      }
  };
  
  const handleRoleChange = async (memberId: string, newRole: Member['role']) => {
      if (!group || currentUserRole !== 'Owner') return;
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
      if (!group || !user) return;
      try {
          const newProjectRef = await addDoc(collection(db, 'projects'), {
              groupId: group.id,
              userId: user.uid,
              inputText: 'New Shared Document',
              operation: 'document',
              createdAt: serverTimestamp(),
              lastEditedBy: user.uid,
              lastEditedAt: serverTimestamp(),
              ownerId: user.uid,
              members: group.members,
          });
          router.push(`/workspace?projectId=${newProjectRef.id}`);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Failed to create project' });
      }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (currentUserRole !== 'Owner' && currentUserRole !== 'Editor') {
        toast({ variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    await deleteDoc(doc(db, "projects", projectId));
    toast({ title: "Project Deleted" });
  }

  if (loading || authLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-background">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
           </div>;
  }

  if (!group) {
    return <div className="text-center p-8">Group not found or you don't have access.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4"/></Button>
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
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Group Projects</CardTitle>
                            <CardDescription>Projects shared within this group.</CardDescription>
                        </div>
                        {(currentUserRole === 'Owner' || currentUserRole === 'Editor') && (
                            <Button onClick={handleCreateProject}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Project
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {projects.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No shared projects yet.</p>
                                {(currentUserRole === 'Owner' || currentUserRole === 'Editor') && (
                                    <Button onClick={handleCreateProject} className="mt-4">Create First Project</Button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {projects.map(p => (
                                    <Card key={p.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader>
                                            <CardTitle className="text-lg truncate">{p.inputText}</CardTitle>
                                            <CardDescription>
                                                {p.createdAt ? formatDistanceToNow(new Date(p.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardFooter className="flex justify-end gap-2">
                                            {(currentUserRole === 'Owner' || currentUserRole === 'Editor') && (
                                                <Button variant="destructive" size="icon" onClick={() => handleDeleteProject(p.id)}><Trash2 className="h-4 w-4"/></Button>
                                            )}
                                            <Button variant="outline" onClick={() => router.push(`/workspace?projectId=${p.id}`)}>
                                                <Edit className="h-4 w-4 mr-2"/>Open
                                            </Button>
                                        </CardFooter>
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
                                        <AvatarImage src={(member as any).photoURL}/>
                                        <AvatarFallback>{member.name?.[0].toUpperCase() || '?'}</AvatarFallback>
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
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{member.role}</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent>
                                                    <DropdownMenuItem onSelect={() => handleRoleChange(member.uid, 'Editor')}>Editor</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleRoleChange(member.uid, 'Viewer')}>Viewer</DropdownMenuItem>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onSelect={() => handleRemoveMember(member)}>Remove from group</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Badge variant={member.role === 'Owner' ? 'default' : 'secondary'}>{member.role}</Badge>
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
