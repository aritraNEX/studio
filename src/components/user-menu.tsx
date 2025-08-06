
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { auth, storage, db } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { LogOut, User as UserIcon, Loader2, Save, LayoutDashboard, Camera, Puzzle } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "./ui/textarea";
import { useLanguage, allLanguageOptions } from '@/contexts/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

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
    setIsSaving(true);
    try {
        await updateProfile(user, { displayName });
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { bio }, { merge: true });
        
        toast({ title: "Profile updated successfully!" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to update profile", description: error.message });
    } finally {
        setIsSaving(false);
    }
  }

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const storageRef = ref(storage, `profilePictures/${user.uid}`);
    
    setIsSaving(true);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        
        await updateProfile(user, { photoURL });
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { photoURL }, { merge: true });

        toast({ title: "Profile picture updated!" });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload new profile picture." });
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => handleNavigate('/dashboard')} variant="outline" size="sm" className="hidden sm:flex bg-white/10 text-white border-white/20 hover:bg-white/20">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          {t('profile_my_projects')}
      </Button>
      <ThemeToggle />
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-transparent hover:border-primary/50 transition-colors">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>
                {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader className="items-center text-center">
            <div className="relative group">
                <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} className="text-5xl" />
                <AvatarFallback className="text-5xl">
                    {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon />}
                </AvatarFallback>
                </Avatar>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePictureUpload}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
                 <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-4 right-0 rounded-full h-8 w-8 bg-background/80 group-hover:bg-background transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                 >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4" />}
                </Button>
            </div>
            
            <DialogTitle className="text-2xl flex items-center gap-2">
                <Input 
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-2xl font-bold text-center border-none focus-visible:ring-1 focus-visible:ring-ring"
                    disabled={isSaving}
                />
            </DialogTitle>
             <p className="text-sm text-muted-foreground">{user.email}</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself..."
                    className="resize-none"
                    rows={3}
                    disabled={isSaving}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="language-select">Language</Label>
                <Select value={language} onValueChange={(value) => setLanguage(value)}>
                  <SelectTrigger id="language-select">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLanguageOptions.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <Button onClick={() => handleNavigate('/dashboard')} variant="outline" className="w-full sm:hidden">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('profile_my_projects')}
            </Button>
             <Button onClick={() => handleNavigate('/integrations')} variant="outline" className="w-full sm:hidden">
                <Puzzle className="mr-2 h-4 w-4" />
                {t('integrations_button')}
            </Button>
          </div>
          <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('profile_logout')}</span>
            </Button>
            <Button onClick={handleProfileUpdate} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t('profile_save_changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
