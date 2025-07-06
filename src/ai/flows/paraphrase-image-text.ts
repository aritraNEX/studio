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
  prompt: `Extract all text from the image, in the correct sequence. Then, paraphrase the extracted text. The paraphrase should be a faithful representation of the original text. Do not add any new information or invent details. The output should be a fluent sentence that uses as many words from the image as possible, in order.

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
