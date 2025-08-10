
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithPhoneNumber, sendPasswordResetEmail, RecaptchaVerifier, type ConfirmationResult, type UserCredential, type User, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog"
import { useLanguage, allLanguageOptions } from '@/contexts/language-context';

const countryCodes = [
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' },
    { name: 'Germany', code: '+49', flag: '🇩🇪' },
    { name: 'France', code: '+33', flag: '🇫🇷' },
    { name: 'Japan', code: '+81', flag: '🇯🇵' },
    { name: 'Brazil', code: '+55', flag: '🇧🇷' },
    { name: 'South Africa', code: '+27', flag: '🇿🇦' },
];

async function createUserDocument(user: User) {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    // Only create document if it doesn't exist
    if (!docSnap.exists()) {
        await setDoc(userRef, { 
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || `https://placehold.co/100x100.png?text=${(user.displayName || user.email || 'U').charAt(0).toUpperCase()}`,
            bio: "",
            createdAt: serverTimestamp(),
        });
    }
}

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState(countryCodes[0].code);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {},
        'expired-callback': () => {}
      });
    }
  }, []);

  const handleSuccessfulAuth = async (user: User, isNewUser: boolean = false) => {
    if (isNewUser) {
        // If it's a new user from email/password, ensure displayName is set
        if (!user.displayName && signupEmail) {
            const nameFromEmail = signupEmail.split('@')[0];
            await updateProfile(user, { displayName: nameFromEmail });
        }
    }
    await createUserDocument(user);
    toast({ title: isNewUser ? 'Sign up successful!' : 'Login successful!' });
    router.push('/?welcome=true');
  };

  const handleLogin = async () => {
    setIsPending(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      await handleSuccessfulAuth(user);
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          description = "Incorrect email or password. Please try again.";
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: description,
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleSignUp = async () => {
    setIsPending(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      await handleSuccessfulAuth(user, true);
    } catch (error: any) {
      let description = error.message;
      if (error.code === 'auth/email-already-in-use') {
          description = 'This email is already registered. Please log in instead.';
      } else if (error.code === 'auth/weak-password') {
          description = 'The password is too weak. Please choose a stronger password.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: description,
      });
    } finally {
      setIsPending(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: 'destructive', title: 'Email required', description: 'Please enter your email address to reset your password.' });
        return;
    }
    setIsPending(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for a link to reset your password.' });
    } catch (error: any) {
         toast({ variant: 'destructive', title: 'Password Reset Failed', description: error.message });
    } finally {
        setIsPending(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    const provider = new GoogleAuthProvider();
    try {
        auth.languageCode = 'en'; 
        const { user } = await signInWithPopup(auth, provider);
        await handleSuccessfulAuth(user);
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message,
        });
    } finally {
        setIsPending(false);
    }
  }

  const handlePhoneSignIn = async () => {
    setIsPending(true);
    try {
        const verifier = window.recaptchaVerifier;
        const formattedPhone = `${countryCode}${phone}`;
        const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        setConfirmationResult(result);
        toast({ title: 'OTP Sent!', description: 'Please check your phone for the verification code.' });
    } catch (error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Failed to send OTP', description: error.message });
    } finally {
        setIsPending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) return;
    setIsPending(true);
    try {
        const { user } = await confirmationResult.confirm(otp);
        await handleSuccessfulAuth(user);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Invalid OTP', description: 'The OTP you entered is incorrect. Please try again.' });
    } finally {
        setIsPending(false);
    }
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1e145f] via-[#2d2182] to-[#4032a8] p-4 text-white">
      <div id="recaptcha-container"></div>
      <Tabs defaultValue="login" className="w-full max-w-sm">
        <div className="text-center mb-6">
            <div className="mx-auto w-fit mb-4">
                <svg
                    width="48"
                    height="48"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12"
                    >
                    <circle cx="40" cy="40" r="30" className="fill-primary" />
                    <circle cx="70" cy="35" r="20" className="fill-primary/70" />
                    <circle cx="65" cy="75" r="25" className="fill-accent" />
                    <circle cx="80" cy="70" r="10" className="fill-primary" />
                </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{t('login_welcome_title')}</h1>
            <p className="text-lg text-white/80 mt-2">{t('login_welcome_subtitle')}</p>
        </div>
        <TabsList className="grid w-full grid-cols-3 bg-white/10 text-white/80">
          <TabsTrigger value="login" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">Login</TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">Sign Up</TabsTrigger>
          <TabsTrigger value="phone" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">Phone</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card className="bg-transparent border-white/20">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription className="text-white/70">Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" placeholder="m@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="bg-white/10 border-white/30 focus:bg-white/20" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="link" className="h-auto p-0 text-xs text-white/80 hover:text-white">
                            Forgot Password?
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Password</AlertDialogTitle>
                          <AlertDialogDescription>
                            Enter your email address below and we'll send you a link to reset your password.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4">
                           <Label htmlFor="reset-email" className="sr-only">Email for password reset</Label>
                           <Input id="reset-email" type="email" placeholder="m@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handlePasswordReset} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Reset Link
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="bg-white/10 border-white/30 focus:bg-white/20" />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button onClick={handleLogin} className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="bg-transparent border-white/20">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription className="text-white/70">Create a new account to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="m@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className="bg-white/10 border-white/30 focus:bg-white/20"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required className="bg-white/10 border-white/30 focus:bg-white/20"/>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button onClick={handleSignUp} className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="phone">
          <Card className="bg-transparent border-white/20">
            <CardHeader>
              <CardTitle>Sign In with Phone</CardTitle>
              <CardDescription className="text-white/70">We'll send a verification code to your phone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!confirmationResult ? (
                <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-[120px] bg-white/10 border-white/30">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {countryCodes.map(country => (
                                    <SelectItem key={country.name} value={country.code}>
                                        {country.flag} {country.code}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input id="phone-number" type="tel" placeholder="555-555-5555" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} required className="bg-white/10 border-white/30 focus:bg-white/20"/>
                    </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input id="otp" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required className="bg-white/10 border-white/30 focus:bg-white/20"/>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {!confirmationResult ? (
                <Button onClick={handlePhoneSignIn} className="w-full" disabled={isPending || !phone}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              ) : (
                <Button onClick={handleVerifyOtp} className="w-full" disabled={isPending || !otp}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify OTP
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#2d2182] px-2 text-white/70">
                Or continue with
                </span>
            </div>
        </div>
        <Button variant="outline" className="w-full bg-white/10 border-white/30 hover:bg-white/20" onClick={handleGoogleSignIn} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaGoogle className="mr-2 h-4 w-4" />}
            Google
        </Button>
        <div className="mt-4 flex justify-center items-center gap-2">
            <Globe className="h-4 w-4 text-white/70" />
            <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'es')}>
              <SelectTrigger className="w-[180px] bg-transparent border-none focus:ring-0 text-white/70">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {allLanguageOptions.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </Tabs>
    </div>
  );
}
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}
