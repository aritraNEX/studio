
'use server';
/**
 * @fileOverview A general purpose chat flow.
 *
 * - generalChatFlow - A function that handles a user query, optionally with an image.
 * - GeneralChatInput - The input type for the generalChatFlow function.
 * - GeneralChatOutput - The return type for the generalChatFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralChatInputSchema = z.object({
  query: z.string().describe('The user\'s question or prompt.'),
  fileUrl: z.string().describe('An optional image file to provide context, as a data URI.').optional(),
});
export type GeneralChatInput = z.infer<typeof GeneralChatInputSchema>;

const GeneralChatOutputSchema = z.object({
  answer: z.string().describe('The AI\'s response to the user\'s query.'),
});
export type GeneralChatOutput = z.infer<typeof GeneralChatOutputSchema>;

export async function generalChatFlow(
  input: GeneralChatInput
): Promise<GeneralChatOutput> {
  const promptParts = [
    { text: input.query }
  ];

  if (input.fileUrl) {
    promptParts.unshift({ media: { url: input.fileUrl } });
  }

  const llmResponse = await ai.generate({
    prompt: promptParts,
  });

  return { answer: llmResponse.text };
}
