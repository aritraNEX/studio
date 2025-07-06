'use server';
/**
 * @fileOverview This file defines a Genkit flow for processing text extracted from an image.
 *
 * - processImageText - A function that accepts an image and performs an operation (paraphrase, summarize, translate) on the extracted text.
 * - ProcessImageTextInput - The input type for the processImageText function.
 * - ProcessImageTextOutput - The return type for the processImageText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessImageTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  operation: z.enum(['paraphrase', 'summarize', 'translate']).describe('The operation to perform on the text.'),
  targetLanguage: z.string().optional().describe('The target language for translation. Required if operation is "translate".'),
});
export type ProcessImageTextInput = z.infer<typeof ProcessImageTextInputSchema>;

const ProcessImageTextOutputSchema = z.object({
  processedText: z
    .string()
    .describe('The processed text (paraphrased, summarized, or translated).'),
});
export type ProcessImageTextOutput = z.infer<typeof ProcessImageTextOutputSchema>;

export async function processImageText(
  input: ProcessImageTextInput
): Promise<ProcessImageTextOutput> {
  return processImageTextFlow(input);
}

const promptInputSchema = z.object({
    photoDataUri: ProcessImageTextInputSchema.shape.photoDataUri,
    instruction: z.string()
});

const processImageTextPrompt = ai.definePrompt({
  name: 'processImageTextPrompt',
  input: {schema: promptInputSchema},
  output: {schema: ProcessImageTextOutputSchema},
  prompt: `Extract all text from the image, in the correct sequence. Then, follow this instruction: '{{{instruction}}}'. Place the final result in the 'processedText' field. Do not add any extra commentary or explanation.

  Image: {{media url=photoDataUri}}`
});

const processImageTextFlow = ai.defineFlow(
  {
    name: 'processImageTextFlow',
    inputSchema: ProcessImageTextInputSchema,
    outputSchema: ProcessImageTextOutputSchema,
  },
  async (input) => {
    let instruction = '';
    switch(input.operation) {
      case 'paraphrase':
        instruction = `Paraphrase the extracted text. The paraphrase should be a faithful representation of the original text. Do not add any new information or invent details. The output should be a fluent sentence that uses as many words from the image as possible, in order.`;
        break;
      case 'summarize':
        instruction = `Summarize the extracted text. Provide a concise summary that captures the main points.`;
        break;
      case 'translate':
        if (!input.targetLanguage) {
          throw new Error('Target language is required for translation.');
        }
        instruction = `Translate the extracted text to ${input.targetLanguage}.`;
        break;
      default:
        throw new Error('Invalid operation specified.');
    }

    const {output} = await processImageTextPrompt({
      photoDataUri: input.photoDataUri,
      instruction: instruction,
    });
    
    if (!output) {
      throw new Error('The model did not return any output.');
    }
    
    return output;
  }
);
