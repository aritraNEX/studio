
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createWorkspace } from '@/lib/workspace-utils';
import { Loader2, Plus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';

export function CreateWorkspace() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createWorkspace(name, description, user);
      toast({ title: "Workspace Created!", description: `"${name}" is ready.` });
      // The page will automatically update due to the listener in WorkspacePage
    } catch (e) {
      console.error('Failed to create workspace', e);
      toast({ variant: 'destructive', title: 'Creation Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
                <Wand2 className="mx-auto h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-3xl">Create Your First Workspace</CardTitle>
                <CardDescription>A shared space for you and your team to collaborate on tasks and projects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                        id="workspace-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Q4 Marketing Campaign"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="workspace-description">Description (Optional)</Label>
                     <Textarea
                        id="workspace-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What's this workspace for?"
                    />
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={handleCreate} disabled={loading || !name} className="w-full" size="lg">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Create Workspace
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}

