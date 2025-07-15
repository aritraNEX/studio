
'use server';
/**
 * @fileOverview This file defines a Genkit flow for processing text from an image or raw text.
 *
 * - processImageText - A function that accepts an image or text and performs an operation (paraphrase, summarize, translate, style).
 * - ProcessImageTextInput - The input type for the processImageText function.
 * - ProcessImageTextOutput - The return type for the processImageText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BaseProcessImageTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo containing text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ).optional(),
  text: z.string().describe("Raw text to be processed.").optional(),
  operation: z.enum(['paraphrase', 'summarize', 'translate', 'style']).describe('The operation to perform on the text.'),
  targetLanguage: z.string().optional().describe('The target language for translation. Required if operation is "translate".'),
  targetStyle: z.string().optional().describe('The target style for rewriting. Required if operation is "style".'),
});

const ProcessImageTextInputSchema = BaseProcessImageTextInputSchema.refine(data => data.photoDataUri || data.text, {
    message: "Either photoDataUri or text must be provided."
});

export type ProcessImageTextInput = z.infer<typeof ProcessImageTextInputSchema>;

const ProcessImageTextOutputSchema = z.object({
  processedText: z
    .string()
    .describe('The processed text (paraphrased, summarized, translated, or styled).'),
});
export type ProcessImageTextOutput = z.infer<typeof ProcessImageTextOutputSchema>;

export async function processImageText(
  input: ProcessImageTextInput
): Promise<ProcessImageTextOutput> {
  return processImageTextFlow(input);
}

const promptInputSchema = z.object({
    photoDataUri: BaseProcessImageTextInputSchema.shape.photoDataUri,
    text: BaseProcessImageTextInputSchema.shape.text,
    instruction: z.string()
});

const processImageTextPrompt = ai.definePrompt({
  name: 'processImageTextPrompt',
  input: {schema: promptInputSchema},
  output: {schema: ProcessImageTextOutputSchema},
  prompt: `{{#if photoDataUri}}Extract all text from the image, in the correct sequence, preserving the original structure like lists and line breaks.{{else}}The text to process is provided below.{{/if}} Then, follow this instruction: '{{{instruction}}}'. Place the final result in the 'processedText' field. Ensure the output formatting matches the original text's structure (e.g., lists, paragraphs). Do not add any extra commentary or explanation.

  {{#if photoDataUri}}Image: {{media url=photoDataUri}}{{else}}Text: {{{text}}}{{/if}}`
});

const processImageTextFlow = ai.defineFlow(
  {
    name: 'processImageTextFlow',
    inputSchema: ProcessImageTextInputSchema,
    outputSchema: ProcessImageTextOutputSchema,
  },
  async (input) => {
    if (input.text && !input.text.trim()) {
        return { processedText: "" };
    }
    
    let instruction = '';
    switch(input.operation) {
      case 'paraphrase':
        instruction = `First, identify and correct any grammatical errors, spelling mistakes, or factual inaccuracies in the extracted text. After correcting the text, then paraphrase it. The new version should be a faithful representation of the original text's meaning, but rephrased with different wording. Crucially, preserve the original formatting, including line breaks, lists, and bullet points. Do not add any new information or merge distinct points into a single paragraph.`;
        break;
      case 'summarize':
        instruction = `Summarize the extracted text. Provide a concise summary that captures the main points.`;
        break;
      case 'translate':
        if (!input.targetLanguage) {
          throw new Error('Target language is required for translation.');
        }
        instruction = `Translate the extracted text to ${input.targetLanguage}. Preserve the original formatting like lists and line breaks.`;
        break;
      case 'style':
        if (!input.targetStyle) {
          throw new Error('Target style is required for rewriting.');
        }
        instruction = `Rewrite the extracted text to match the following style: "${input.targetStyle}". If the style mentions a famous author, adopt their distinct writing style, including their typical vocabulary, sentence structure, and tone. Preserve the original formatting, including line breaks, lists, and bullet points.`;
        break;
      default:
        throw new Error('Invalid operation specified.');
    }

    const {output} = await processImageTextPrompt({
      photoDataUri: input.photoDataUri,
      text: input.text,
      instruction: instruction,
    });
    
    if (!output) {
      throw new Error('The model did not return any output.');
    }
    
    return output;
  }
);
