
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { auth, storage, db } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import Link from 'next/link';
import { LogOut, User as UserIcon, Loader2, Save, LayoutDashboard, Camera, Puzzle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { ScrollArea } from "./ui/scroll-area";

export default function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    if (displayName.trim() === "") {
        toast({ variant: "destructive", title: t('user_menu.toast.name_empty') });
        return;
    }
    setIsSaving(true);
    try {
        await updateProfile(user, { displayName });
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { bio }, { merge: true });
        
        toast({ title: t('user_menu.toast.profile_updated_title') });
    } catch (error: any) {
        toast({ variant: "destructive", title: t('user_menu.toast.profile_update_failed_title'), description: error.message });
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

        toast({ title: t('user_menu.toast.picture_updated_title') });
    } catch (error: any) {
        toast({ variant: "destructive", title: t('user_menu.toast.upload_failed_title'), description: t('user_menu.toast.upload_failed_desc') });
    } finally {
        setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard" passHref>
        <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <span>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('profile_my_projects')}
            </span>
        </Button>
      </Link>
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
        <DialogContent className="w-full max-w-lg p-0">
          <ScrollArea className="max-h-[80vh]">
            <div className="p-6">
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
                <DialogDescription>{user.email}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="bio">{t('user_menu.bio')}</Label>
                    <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder={t('user_menu.bio_placeholder')}
                        className="resize-none"
                        rows={3}
                        disabled={isSaving}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="language-select">{t('user_menu.language')}</Label>
                    <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'es')}>
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
                <Link href="/dashboard" passHref>
                    <Button asChild variant="outline" className="w-full sm:hidden">
                        <span><LayoutDashboard className="mr-2 h-4 w-4" />{t('profile_my_projects')}</span>
                    </Button>
                </Link>
                <Link href="/integrations" passHref>
                  <Button asChild variant="outline" className="w-full sm:hidden">
                      <span><Puzzle className="mr-2 h-4 w-4" />{t('integrations_button')}</span>
                  </Button>
                </Link>
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
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    