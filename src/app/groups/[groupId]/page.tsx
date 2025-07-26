
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ServerCrash, Home, Users, Settings, Mail, Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { VesperApp } from '@/components/texio-app';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Member {
  uid: string;
  email: string;
  photoURL?: string;
  name?: string;
}

interface GroupData {
  id: string;
  name: string;
  ownerId: string;
  members: Member[];
  // Other group data will eventually go here.
}

function GroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isOwner = user && groupData && user.uid === groupData.ownerId;
  const isMember = user && groupData && groupData.members.some(m => m.uid === user.uid);

  useEffect(() => {
    if (!groupId) return;
    if (authLoading) return;

    const docRef = doc(db, 'groups', groupId as string);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentUserIsMember = data.members.some((m: Member) => m.uid === user?.uid);

        if (!currentUserIsMember) {
          setError('Access denied. You are not a member of this group.');
          setLoading(false);
          return;
        }

        setGroupData({
          id: docSnap.id,
          name: data.name,
          ownerId: data.ownerId,
          members: data.members,
        });
        setError(null);
      } else {
        setError('Group not found. This link may be invalid or the group may have been deleted.');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load the group. Please try again later.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, user, authLoading]);

  const handleInvite = async () => {
    if (!inviteEmail || !isOwner) return;
    setIsSubmitting(true);
    
    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) {
        toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
        setIsSubmitting(false);
        return;
    }

    try {
        const q = query(collection(db, 'users'), where('email', '==', inviteEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ variant: "destructive", title: "User not found", description: `No Vesper user found with the email: ${inviteEmail}` });
            setIsSubmitting(false);
            return;
        }
        
        const invitedUser = querySnapshot.docs[0].data();
        const invitedUserId = querySnapshot.docs[0].id;
        
        if (groupData?.members.some(m => m.uid === invitedUserId)) {
            toast({ variant: "destructive", title: "Already a member", description: "This user is already in the group." });
            setIsSubmitting(false);
            return;
        }

        const newMember: Member = {
            uid: invitedUserId,
            email: invitedUser.email,
            photoURL: invitedUser.photoURL || '',
            name: invitedUser.displayName || invitedUser.email,
        };
        
        const groupRef = doc(db, 'groups', groupId as string);
        await updateDoc(groupRef, {
            members: arrayUnion(newMember)
        });
        
        toast({ title: "Invitation Sent!", description: `${inviteEmail} has been added to the group.` });
        setInviteEmail("");

    } catch (e) {
        toast({ variant: "destructive", title: "Invitation Failed", description: "An error occurred while sending the invite." });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleRemoveMember = async (memberUid: string) => {
    if (!isOwner || memberUid === groupData?.ownerId) return;
    
    const memberToRemove = groupData?.members.find(m => m.uid === memberUid);
    if (!memberToRemove) return;
    
    try {
        const groupRef = doc(db, 'groups', groupId as string);
        await updateDoc(groupRef, {
            members: arrayRemove(memberToRemove)
        });
        toast({ title: "Member Removed", description: `${memberToRemove.email} has been removed from the group.` });
    } catch(e) {
        toast({ variant: 'destructive', title: "Failed to remove member." });
    }
  }

  const getShareLink = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/groups/${groupId}/join`;
    }
    return "";
  };


  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <Card className="max-w-lg text-center">
            <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                   <ServerCrash className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="mt-4">Access Error</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={() => router.push('/groups')}>
                    <Home className="mr-2 h-4 w-4" /> Go to My Groups
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (groupData && isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
                <Users className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">{groupData.name}</h1>
            </div>
            <div className="flex items-center gap-2">
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage "{groupData.name}"</DialogTitle>
                            <DialogDescription>
                                {isOwner ? "Invite new members, manage existing ones, or get a shareable link." : "View group members."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            {isOwner && (
                                <div className="space-y-2">
                                    <Label htmlFor="invite-email">Invite with Email</Label>
                                    <div className="flex gap-2">
                                        <Input id="invite-email" type="email" placeholder="member@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                        <Button onClick={handleInvite} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Mail className="h-4 w-4"/>}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Members ({groupData.members.length})</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {groupData.members.map(member => (
                                        <div key={member.uid} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.photoURL} />
                                                    <AvatarFallback>{member.email?.[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{member.name || member.email} {member.uid === groupData.ownerId && "(Owner)"}</span>
                                            </div>
                                            {isOwner && user.uid !== member.uid && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveMember(member.uid)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                 </Dialog>
                <Button onClick={() => router.push('/groups')}>
                    <Home className="mr-2 h-4 w-4" />
                    All Groups
                </Button>
            </div>
            </div>
        </header>
        <main className="p-4 sm:p-8">
            <VesperApp />
        </main>
      </div>
    );
  }

  return null;
}

export default GroupPage;
