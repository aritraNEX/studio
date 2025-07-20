
/**
 * @fileOverview Stripe Webhook API Route
 *
 * This route listens for webhook events from Stripe to manage subscriptions.
 * It securely verifies the webhook signature and updates the user's premium
 * status in Firestore when a checkout session is successfully completed.
 */

import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase-admin';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const buf = await req.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Error message: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Handle the 'checkout.session.completed' event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // The user's ID is stored in client_reference_id during checkout session creation
    const userId = session.client_reference_id;
    const stripeSubscriptionId = session.subscription;

    if (!userId) {
      console.error('❌ Error: Missing userId in Stripe session.');
      return new Response('Error: Missing userId in session.', { status: 400 });
    }
    
    console.log(`✅ Checkout session completed for user: ${userId}`);

    try {
        if (!adminDb) {
            throw new Error("Admin DB not initialized.");
        }
        // Update the user's document in Firestore to grant premium access
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.set({
            isPremium: true,
            stripeSubscriptionId: stripeSubscriptionId,
        }, { merge: true });

        console.log(`✨ User ${userId} has been granted premium access.`);
    } catch (error) {
        console.error('❌ Firestore update failed:', error);
        return new Response('Webhook handler failed to update user in Firestore.', { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
