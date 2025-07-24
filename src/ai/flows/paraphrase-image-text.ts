
'use server';
/**
 * @fileOverview This file defines a Genkit flow for processing text from an image or raw text.
 *
 * - processImageText - A function that accepts an image or text and performs an operation (paraphrase, summarize, translate, style, grammar).
 * - ProcessImageTextInput - The input type for the processImageText function.
 * - ProcessImageTextOutput - The return type for the processImageText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessImageTextInputObject = z.object({
  fileUrl: z
    .string()
    .describe(
      "A file (image, PDF, etc.) to be processed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ).optional(),
  text: z.string().describe("Raw text to be processed.").optional(),
  operation: z.enum(['paraphrase', 'summarize', 'translate', 'style', 'grammar']).describe('The operation to perform on the text.'),
  targetLanguage: z.string().optional().describe('The target language for translation. Required if operation is "translate".'),
  targetStyle: z.string().optional().describe('The target style for rewriting. Required if operation is "style".'),
});

const ProcessImageTextInputSchema = ProcessImageTextInputObject.refine(data => data.fileUrl || data.text, {
    message: "Either fileUrl or text must be provided.",
});


export type ProcessImageTextInput = z.infer<typeof ProcessImageTextInputSchema>;

const ProcessImageTextOutputSchema = z.object({
  processedText: z
    .string()
    .describe('The processed text (paraphrased, summarized, translated, styled, or grammar-corrected).'),
});
export type ProcessImageTextOutput = z.infer<typeof ProcessImageTextOutputSchema>;

export async function processImageText(
  input: ProcessImageTextInput
): Promise<ProcessImageTextOutput> {
  return processImageTextFlow(input);
}

const promptInputSchema = z.object({
    fileUrl: ProcessImageTextInputObject.shape.fileUrl,
    text: ProcessImageTextInputObject.shape.text,
    instruction: z.string()
});

const processImageTextPrompt = ai.definePrompt({
  name: 'processImageTextPrompt',
  input: {schema: promptInputSchema},
  output: {schema: ProcessImageTextOutputSchema},
  prompt: `{{#if fileUrl}}You will be given a document (image, PDF, etc.). Extract all text from this document, in the correct sequence, preserving the original structure like lists and line breaks. Then, follow this instruction: '{{{instruction}}}'. Place the final result in the 'processedText' field. Ensure the output formatting matches the original text's structure (e.g., lists, paragraphs). Do not add any extra commentary or explanation.

Document: {{media url=fileUrl}}{{else}}You will be given text to process. Follow this instruction: '{{{instruction}}}'. Place the final result in the 'processedText' field. Ensure the output formatting matches the original text's structure (e.g., lists, paragraphs). Do not add any extra commentary or explanation.

Text: {{{text}}}{{/if}}`
});

const processImageTextFlow = ai.defineFlow(
  {
    name: 'processImageTextFlow',
    inputSchema: ProcessImageTextInputSchema,
    outputSchema: ProcessImageTextOutputSchema,
  },
  async (input) => {
    if (!input.fileUrl && (!input.text || !input.text.trim())) {
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
        if (input.targetStyle === 'original') {
          instruction = `Extract all text from this document, in the correct sequence, preserving the original structure like lists and line breaks. Output only the extracted text.`;
        } else {
          instruction = `Rewrite the extracted text to match the following style: "${input.targetStyle}". If the style is a specific genre like 'Academic' or 'Business', adopt the conventions of that genre (e.g., formal tone, specific vocabulary, structured arguments). If the style mentions a famous author, adopt their distinct writing style, including their typical vocabulary, sentence structure, and tone. Preserve the original formatting, including line breaks, lists, and bullet points.`;
        }
        break;
      case 'grammar':
        instruction = `You are a grammar correction expert. Analyze the following text and correct any and all grammatical errors, spelling mistakes, and punctuation issues. Your goal is to improve the text's clarity and correctness without altering its original meaning, style, or tone. Preserve the original formatting, including line breaks and lists. Only output the corrected text.`;
        break;
      default:
        throw new Error('Invalid operation specified.');
    }

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const {output} = await processImageTextPrompt({
                fileUrl: input.fileUrl,
                text: input.text,
                instruction: instruction,
            });
            
            if (!output) {
                throw new Error('The model did not return any output.');
            }
            
            return output; // Success, exit the loop
        } catch (e: any) {
            if (e.message?.includes('overloaded') && i < maxRetries - 1) {
                console.log(`Model overloaded, retrying... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
                continue;
            }
            if (e.message?.includes('overloaded')) {
                throw new Error('The AI model is currently busy. Please try again in a moment.');
            }
            if (e.message?.includes('API key not valid')) {
                throw new Error('The AI service API key is not valid. Please check your configuration.');
            }
            if (e.message?.includes('Deadline exceeded')) {
                throw new Error('The request to the AI model timed out. Please try again.');
            }
            // Re-throw other errors
            throw e;
        }
    }
    // This part should not be reachable, but as a fallback:
    throw new Error('The AI model is currently busy. Please try again after a few moments.');
  }
);
