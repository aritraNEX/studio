
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { LogOut, User as UserIcon, Loader2, Edit, Save, LayoutDashboard, Group } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleNavigate = (path: string) => {
    router.push(path);
  };
  
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    if (displayName.trim() === "") {
        toast({ variant: "destructive", title: "Name cannot be empty." });
        return;
    }
    setIsPending(true);
    try {
        await updateProfile(user, { displayName });
        toast({ title: "Profile updated successfully!" });
        setIsEditing(false);
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to update profile", description: error.message });
    } finally {
        setIsPending(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Dialog onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>
                {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-md">
          <DialogHeader className="items-center text-center">
             <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} className="text-5xl" />
              <AvatarFallback className="text-5xl">
                {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-2xl">User Profile</DialogTitle>
            <DialogDescription>
              View and manage your account details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                    Email
                </Label>
                <Input id="email" value={user.email ?? 'No email provided'} readOnly className="col-span-3 bg-muted" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                    Name
                </Label>
                {isEditing ? (
                    <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="col-span-3" />
                ) : (
                    <div className="col-span-3 flex items-center justify-between">
                        <p className="font-medium">{displayName || "Not set"}</p>
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
             <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <DialogClose asChild>
                    <Button onClick={() => handleNavigate('/dashboard')} className="w-full">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        My Projects
                    </Button>
                 </DialogClose>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </Button>
            {isEditing && (
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleProfileUpdate} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save
                    </Button>
                </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
