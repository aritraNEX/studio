'use server';
/**
 * @fileOverview This file defines a Genkit flow for paraphrasing text extracted from an image.
 *
 * - paraphraseImageText - A function that accepts an image containing text, extracts the text, and paraphrases it.
 * - ParaphraseImageTextInput - The input type for the paraphraseImageText function.
 * - ParaphraseImageTextOutput - The return type for the paraphraseImageText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParaphraseImageTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo containing text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type ParaphraseImageTextInput = z.infer<typeof ParaphraseImageTextInputSchema>;

const ParaphraseImageTextOutputSchema = z.object({
  paraphrasedText: z
    .string()
    .describe('The paraphrased text extracted from the image.'),
});
export type ParaphraseImageTextOutput = z.infer<typeof ParaphraseImageTextOutputSchema>;

export async function paraphraseImageText(
  input: ParaphraseImageTextInput
): Promise<ParaphraseImageTextOutput> {
  return paraphraseImageTextFlow(input);
}

const paraphraseImageTextPrompt = ai.definePrompt({
  name: 'paraphraseImageTextPrompt',
  input: {schema: ParaphraseImageTextInputSchema},
  output: {schema: ParaphraseImageTextOutputSchema},
  prompt: `You are an AI expert in extracting text from images and paraphrasing it to be more descriptive and detailed while maintaining context and style.

  Given the image with text content, extract the text and then paraphrase it, expanding on the original ideas and providing more details. Maintain the original context and style of the text.

  Image: {{media url=photoDataUri}}
  `,
});

const paraphraseImageTextFlow = ai.defineFlow(
  {
    name: 'paraphraseImageTextFlow',
    inputSchema: ParaphraseImageTextInputSchema,
    outputSchema: ParaphraseImageTextOutputSchema,
  },
  async input => {
    const {output} = await paraphraseImageTextPrompt(input);
    return output!;
  }
);
