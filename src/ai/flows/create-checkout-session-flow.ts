
'use server';
/**
 * @fileOverview A Genkit flow for creating a Stripe Checkout session.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Stripe from 'stripe';

const CreateCheckoutSessionInputSchema = z.object({
  userId: z.string(),
  email: z.string(),
  priceId: z.string(),
  successUrl: z.string(),
  cancelUrl: z.string(),
});
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionInputSchema>;

const CreateCheckoutSessionOutputSchema = z.object({
  sessionId: z.string(),
});
export type CreateCheckoutSessionOutput = z.infer<typeof CreateCheckoutSessionOutputSchema>;

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionOutput> {
  return createCheckoutSessionFlow(input);
}

const createCheckoutSessionFlow = ai.defineFlow(
  {
    name: 'createCheckoutSessionFlow',
    inputSchema: CreateCheckoutSessionInputSchema,
    outputSchema: CreateCheckoutSessionOutputSchema,
    auth: {
      // Ensure the user is logged in to create a session
      required: true,
      policy(auth, input) {
        if (auth.uid !== input.userId) {
          throw new Error('User is not authorized to create this session.');
        }
      },
    },
  },
  async (input) => {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn("STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.");
        throw new Error('Stripe is not configured. Cannot create checkout session.');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        // Associate the checkout session with the Firebase user
        client_reference_id: input.userId,
        // Pre-fill the email address
        customer_email: input.email,
        // We can pass metadata to the webhook
        metadata: {
            firebaseUID: input.userId,
        }
      });

      if (!session.id) {
          throw new Error("Failed to create a valid Stripe session.");
      }

      return { sessionId: session.id };
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred with Stripe.';
      throw new Error(message);
    }
  }
);
