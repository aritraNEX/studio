
'use server';
/**
 * @fileOverview A general purpose, all-powerful chat flow for Vesper Lens.
 *
 * - generalChatFlow - A function that handles any user query, optionally with an image, and provides a comprehensive response.
 * - GeneralChatInput - The input type for the generalChatFlow function.
 * - GeneralChatOutput - The return type for the generalChatFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralChatInputSchema = z.object({
  query: z.string().describe('The user\'s question, command, or prompt. This can be anything from a simple question to a request to write code, a story, or analyze the provided image.'),
  fileUrl: z.string().describe('An optional image file to provide context, as a data URI.').optional(),
});
export type GeneralChatInput = z.infer<typeof GeneralChatInputSchema>;

const GeneralChatOutputSchema = z.object({
  answer: z.string().describe('The AI\'s comprehensive response to the user\'s query.'),
});
export type GeneralChatOutput = z.infer<typeof GeneralChatOutputSchema>;

export async function generalChatFlow(
  input: GeneralChatInput
): Promise<GeneralChatOutput> {
  const systemInstruction = `You are Vesper Lens, a powerful, multi-modal AI assistant. You can do anything the user asks.
- If an image is provided, use it as the primary context for your answer.
- If the user asks a question, answer it thoroughly.
- If the user gives a command (e.g., "write a poem about...", "generate python code for..."), execute it to the best of your ability.
- Be helpful, creative, and comprehensive in all your responses.`;

  const promptParts = [
    { text: systemInstruction },
    { text: input.query }
  ];

  if (input.fileUrl) {
    // Add image part after the system instruction but before the user query for better context.
    promptParts.splice(1, 0, { media: { url: input.fileUrl } });
  }

  const llmResponse = await ai.generate({
    prompt: promptParts,
  });

  return { answer: llmResponse.text };
}
