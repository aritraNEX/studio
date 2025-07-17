
"use client";

import { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
    onSuccess: () => void;
}

export function CheckoutButton({ onSuccess }: CheckoutButtonProps) {
    const stripe = useStripe();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        
        // This is a placeholder. In a real application, you would:
        // 1. Make a request to your backend (e.g., a Firebase Cloud Function).
        // 2. Your backend would create a Stripe Checkout Session and return the session ID.
        // 3. You would use that session ID to redirect to Stripe's payment page.

        try {
            // --- Placeholder Start ---
            console.log("Simulating checkout process...");
            // In a real app, you would get this from your backend.
            const sessionId = "cs_test_placeholder_session_id"; 
            
            // This is where you would redirect to Stripe.
            // Since this is a placeholder, we will just log it and show a success message.
            console.log(`Redirecting to Stripe with session ID: ${sessionId}`);

            // await stripe?.redirectToCheckout({ sessionId });
            
            // Simulating a successful payment after a short delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast({
                title: "Payment Successful! (Simulation)",
                description: "You are now a premium user. All features unlocked!",
            });
            onSuccess(); // Close the modal on success
            // --- Placeholder End ---

        } catch (error: any) {
            console.error("Stripe checkout error:", error);
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="lg"
            className="w-full text-lg font-bold"
            onClick={handleCheckout}
            disabled={loading || !stripe}
        >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {loading ? 'Processing...' : 'Upgrade Now for $1.50/month'}
        </Button>
    );
}
