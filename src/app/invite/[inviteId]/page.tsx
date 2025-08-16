
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface Invite {
  workspaceId: string;
  workspaceName: string;
  invitedBy: string;
}

export default function InvitePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const inviteId = params.inviteId as string;

  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!inviteId) return;

    const fetchInvite = async () => {
      const inviteRef = doc(db, 'invites', inviteId);
      const inviteSnap = await getDoc(inviteRef);

      if (inviteSnap.exists()) {
        setInvite(inviteSnap.data() as Invite);
      } else {
        setError("This invitation is invalid or has expired.");
      }
      setLoading(false);
    };

    fetchInvite();
  }, [inviteId]);
  
  const handleJoinWorkspace = async () => {
      if (!user || !invite) return;
      
      setIsJoining(true);
      const batch = writeBatch(db);
      
      // 1. Add user to the workspace's members map
      const workspaceRef = doc(db, 'workspaces', invite.workspaceId);
      const newMember = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'Member',
      };
      batch.update(workspaceRef, {
        [`members.${user.uid}`]: newMember,
        memberUids: {[user.uid]: true} // Using a map for security rules
      });

      // 2. Delete the one-time invite
      const inviteRef = doc(db, 'invites', inviteId);
      batch.delete(inviteRef);

      try {
        await batch.commit();
        router.push('/workspace');
      } catch (e) {
          console.error("Failed to join workspace:", e);
          setError("Could not join the workspace. Please try again.");
          setIsJoining(false);
      }
  };


  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <CardTitle>You're Invited!</CardTitle>
                    {invite && <CardDescription>Join the '{invite.workspaceName}' workspace.</CardDescription>}
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Please log in or sign up to accept the invitation.</p>
                    <Button asChild>
                        <Link href={`/login?redirect=/invite/${inviteId}`}>Continue</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (error) {
    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="max-w-md text-center">
                <CardHeader>
                    <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <CardTitle>Invitation Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">{error}</p>
                    <Button asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (invite) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="max-w-md text-center">
            <CardHeader>
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <CardTitle>You're Invited!</CardTitle>
                <CardDescription>
                    {invite.invitedBy} has invited you to join the workspace:
                </CardDescription>
                <p className="text-xl font-semibold pt-2">{invite.workspaceName}</p>
            </CardHeader>
            <CardContent>
                <Button onClick={handleJoinWorkspace} disabled={isJoining} size="lg">
                    {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Accept Invitation
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return null; // Should not be reached
}

