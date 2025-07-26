
'use server';
/**
 * @fileOverview A citation generation AI flow.
 *
 * - citationGenerator - A function that generates citations for a given text in a specified style.
 * - CitationGeneratorInput - The input type for the citationGenerator function.
 * - CitationGeneratorOutput - The return type for the citationGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processImageText } from './paraphrase-image-text';

const CitationGeneratorInputObject = z.object({
  text: z.string().describe('The text or topic for which to generate citations.').optional(),
  fileUrl: z.string().describe('A file to be processed, as a data URI.').optional(),
  style: z.enum(['APA', 'MLA', 'Chicago']).describe('The citation style to use.'),
});

const CitationGeneratorInputSchema = CitationGeneratorInputObject.refine(data => data.fileUrl || data.text, {
    message: "Either fileUrl or text must be provided.",
});

export type CitationGeneratorInput = z.infer<typeof CitationGeneratorInputSchema>;

const CitationGeneratorOutputSchema = z.object({
  citations: z
    .array(z.string())
    .describe('A list of formatted citations based on the input text and style.'),
});
export type CitationGeneratorOutput = z.infer<typeof CitationGeneratorOutputSchema>;

export async function citationGenerator(
  input: CitationGeneratorInput
): Promise<CitationGeneratorOutput> {
  return citationGeneratorFlow(input);
}

const PromptInputSchema = z.object({
    text: z.string().describe('The text or topic for which to generate citations.'),
    style: z.enum(['APA', 'MLA', 'Chicago']).describe('The citation style to use.'),
});

const citationGeneratorPrompt = ai.definePrompt({
  name: 'citationGeneratorPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: CitationGeneratorOutputSchema},
  prompt: `You are an expert academic librarian specializing in generating accurate citations. Your task is to analyze the provided text or topic and generate a list of citations in the specified format.

1.  Analyze the following text/topic: '{{{text}}}'.
2.  Identify key concepts, names, and potential sources mentioned or implied in the text.
3.  Based on your knowledge, generate at least 3 plausible and relevant citations from well-known sources (books, articles, websites).
4.  Format all citations strictly according to the '{{style}}' style guide.
5.  Return the formatted citations in the 'citations' array.

Do not invent sources. Use your knowledge of popular and academic works.
`,
});

const citationGeneratorFlow = ai.defineFlow(
  {
    name: 'citationGeneratorFlow',
    inputSchema: CitationGeneratorInputSchema,
    outputSchema: CitationGeneratorOutputSchema,
  },
  async (input) => {
    let textToProcess = input.text;

    if (input.fileUrl) {
      const extractionResult = await processImageText({
        operation: 'style',
        targetStyle: 'original',
        fileUrl: input.fileUrl,
      });
      textToProcess = extractionResult.processedText;
    }

    if (!textToProcess || !textToProcess.trim()) {
      return { citations: [] };
    }

    try {
      const {output} = await citationGeneratorPrompt({
        text: textToProcess,
        style: input.style,
      });
      if (!output) {
        throw new Error("The model did not return any output.");
      }
      return output;
    } catch (e: any) {
      console.error("Error in citationGeneratorFlow: ", e);
      throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
