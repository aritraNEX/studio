
"use client";

import { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/ai/flows/create-checkout-session-flow';
import { useAuth } from '@/contexts/auth-context';

interface CheckoutButtonProps {
    onSuccess: () => void;
}

export function CheckoutButton({ onSuccess }: CheckoutButtonProps) {
    const stripe = useStripe();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleCheckout = async () => {
        if (!user || !stripe) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'User not logged in or Stripe not loaded.',
            });
            return;
        }

        setLoading(true);
        
        try {
            const { sessionId } = await createCheckoutSession({
                userId: user.uid,
                email: user.email || '',
                priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
                successUrl: `${window.location.origin}/?upgraded=true`,
                cancelUrl: window.location.href,
            });

            if (!sessionId) {
                throw new Error("Could not create a checkout session.");
            }

            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                throw error;
            }
            
            onSuccess();
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
            {loading ? 'Redirecting...' : 'Upgrade Now for $1.50/month'}
        </Button>
    );
}
