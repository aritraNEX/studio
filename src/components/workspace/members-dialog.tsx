
"use client";

import { useState, useEffect } from 'react';
import { Copy, Link as LinkIcon, Loader2, Share2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { createInvite, IWorkspace, getWorkspaceMembers, IMember } from '@/lib/workspace-utils';
import { useAuth } from '@/contexts/auth-context';

interface MembersDialogProps {
  workspace: IWorkspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({ workspace, open, onOpenChange }: MembersDialogProps) {
  const { user } = useAuth();
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<IMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && workspace.id) {
        getWorkspaceMembers(workspace.id).then(setMembers);
    }
  }, [open, workspace.id]);

  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
        const inviteId = await createInvite(workspace.id, workspace.name, user?.displayName || "A team member");
        const newLink = `${window.location.origin}/invite/${inviteId}`;
        setInviteLink(newLink);
        toast({ title: "Invite link generated!" });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Failed to create invite.' });
    } finally {
        setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Link copied to clipboard!' });
  };

  const isOwner = user?.uid === workspace.ownerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Workspace Members</DialogTitle>
          <DialogDescription>
            Manage who has access to this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Current Members</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {members.map(member => (
                    <div key={member.uid} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={member.photoURL || ''} />
                                <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{member.displayName}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                            {isOwner && member.uid !== user?.uid && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
          {isOwner && (
            <div className="space-y-2">
                 <h4 className="font-medium">Invite New Members</h4>
                 <Button onClick={handleGenerateInvite} disabled={loading}>
                     {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                     Generate One-Time Invite Link
                 </Button>
                 {inviteLink && (
                    <div className="flex items-center space-x-2 pt-2">
                        <Input value={inviteLink} readOnly />
                        <Button type="button" size="icon" onClick={handleCopyLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                 )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
