
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    const { toast } = useToast();
    const [isPending, setIsPending] = useState(false);

    const handleAddAda = async () => {
        setIsPending(true);
        try {
            const docRef = await addDoc(collection(db, "users"), {
                first: "Ada",
                last: "Lovelace",
                born: 1815,
                createdAt: serverTimestamp()
            });
            toast({ title: "Document Written", description: `Added Ada Lovelace with ID: ${docRef.id}` });
        } catch (e) {
            console.error("Error adding document: ", e);
            toast({ variant: "destructive", title: "Error", description: "Could not add document." });
        } finally {
            setIsPending(false);
        }
    };

    const handleAddTuring = async () => {
        setIsPending(true);
        try {
            const docRef = await addDoc(collection(db, "users"), {
                first: "Alan",
                middle: "Mathison",
                last: "Turing",
                born: 1912,
                createdAt: serverTimestamp()
            });
            toast({ title: "Document Written", description: `Added Alan Turing with ID: ${docRef.id}` });
        } catch (e) {
            console.error("Error adding document: ", e);
            toast({ variant: "destructive", title: "Error", description: "Could not add document." });
        } finally {
            setIsPending(false);
        }
    };

    const handleListUsers = async () => {
        setIsPending(true);
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            console.log("--- All Users ---");
            querySnapshot.forEach((doc) => {
                console.log(`${doc.id} => `, doc.data());
            });
            toast({ title: "Users Logged", description: "Check the developer console to see the list of all users." });
        } catch (e) {
            console.error("Error fetching documents: ", e);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch documents." });
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Admin Firestore Actions</CardTitle>
                    <CardDescription>Use these buttons to perform database operations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleAddAda} className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Ada Lovelace
                    </Button>
                    <Button onClick={handleAddTuring} className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Alan Turing
                    </Button>
                    <Button onClick={handleListUsers} variant="outline" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        List All Users (to Console)
                    </Button>
                    <div className="text-center pt-4">
                        <Button asChild variant="link">
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
