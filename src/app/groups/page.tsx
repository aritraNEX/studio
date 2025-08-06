
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Home, Users, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
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
import { Skeleton } from '@/components/ui/skeleton';

interface Group {
  id: string;
  name: string;
  ownerId: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  memberIds: string[];
}

function GroupsPageSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <Skeleton className="h-5 w-1/4" />
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-28 rounded-md" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const q = query(
      collection(db, 'groups'),
      where('memberIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userGroups: Group[] = [];
      querySnapshot.forEach((doc) => {
        userGroups.push({ id: doc.id, ...doc.data() } as Group);
      });
      setGroups(userGroups);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching groups: ", error);
      toast({
        variant: "destructive",
        title: "Error fetching groups",
        description: "Could not load your groups. Please try again later.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, toast]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    setIsCreating(true);

    try {
        const initialMember = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email,
            role: 'Owner'
        };

        const docRef = await addDoc(collection(db, 'groups'), {
            name: newGroupName,
            ownerId: user.uid,
            members: [initialMember],
            memberIds: [user.uid],
            createdAt: serverTimestamp(),
        });
        toast({ title: "Group Created!", description: `The group "${newGroupName}" has been created.` });
        setIsDialogOpen(false);
        setNewGroupName("");
        router.push(`/groups/${docRef.id}`);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to create group' });
    } finally {
        setIsCreating(false);
    }
  };
  
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    try {
        await deleteDoc(doc(db, 'groups', groupId));
        toast({ title: "Group Deleted", description: `Group "${groupName}" was successfully deleted.` });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Failed to delete group' });
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
         <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                    <Users className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tight">My Groups</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Group
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/')}>
                        <Home className="mr-2 h-4 w-4" />
                        Back to Editor
                    </Button>
                </div>
            </div>
         </header>
         <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <GroupsPageSkeleton />
         </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                <h1 className="text-2xl font-bold tracking-tight">My Groups</h1>
            </div>
            <div className="flex items-center gap-2">
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a New Collaboration Group</DialogTitle>
                            <DialogDescription>
                                Give your new group a name to get started. You can invite members later.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="group-name">Group Name</Label>
                            <Input id="group-name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g., Study Squad, Project Team" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Group
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button asChild variant="outline">
                    <Link href="/" prefetch={false}>
                        <Home className="mr-2 h-4 w-4" />
                        Back to Editor
                    </Link>
                </Button>
            </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {groups.length === 0 ? (
          <div className="text-center py-20 bg-background/50 rounded-xl">
            <h2 className="text-2xl font-semibold">You're not in any groups yet.</h2>
            <p className="text-muted-foreground mt-2 mb-6">
              Create a new group to start collaborating with friends or colleagues.
            </p>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Create Your First Group
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Collaboration Group</DialogTitle>
                        <DialogDescription>
                            Give your new group a name to get started. You can invite members later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="group-name-modal">Group Name</Label>
                        <Input id="group-name-modal" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g., Study Squad, Project Team" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateGroup} disabled={isCreating || !newGroupName.trim()}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Group
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <CardDescription>
                    {group.createdAt?.seconds ? formatDistanceToNow(new Date(group.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4"/> {group.memberIds.length} member{group.memberIds.length > 1 && 's'}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                   {group.ownerId === user?.uid && (
                     <Button variant="destructive" size="icon" onClick={() => handleDeleteGroup(group.id, group.name)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Group</span>
                    </Button>
                   )}
                   {group.ownerId !== user?.uid && (<div></div>)}
                   <Button asChild variant="outline">
                       <Link href={`/groups/${group.id}`} prefetch={false}>
                            Open Group <ArrowRight className="ml-2 h-4 w-4" />
                       </Link>
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
