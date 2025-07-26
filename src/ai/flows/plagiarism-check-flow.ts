
'use server';
/**
 * @fileOverview A plagiarism checking AI flow.
 *
 * - plagiarismCheck - A function that analyzes text for potential plagiarism.
 * - PlagiarismCheckInput - The input type for the plagiarismCheck function.
 * - PlagiarismCheckOutput - The return type for the plagiarismCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processImageText } from './paraphrase-image-text';

const PlagiarismCheckInputObject = z.object({
  text: z.string().describe('The text to be checked for plagiarism.').optional(),
  fileUrl: z.string().describe('A file to be processed, as a data URI.').optional(),
});

const PlagiarismCheckInputSchema = PlagiarismCheckInputObject.refine(data => data.fileUrl || data.text, {
    message: "Either fileUrl or text must be provided.",
});

export type PlagiarismCheckInput = z.infer<typeof PlagiarismCheckInputSchema>;

const PlagiarismCheckOutputSchema = z.object({
  plagiarismScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A score from 0 to 100 representing the likelihood of plagiarism.'
    ),
  isPlagiarized: z
    .boolean()
    .describe(
      'A boolean indicating if the text is considered likely to be plagiarized (score > 50).'
    ),
  report: z
    .string()
    .describe(
      'A detailed report explaining the plagiarism score, highlighting potentially unoriginal phrases and their likely sources based on your knowledge.'
    ),
});
export type PlagiarismCheckOutput = z.infer<typeof PlagiarismCheckOutputSchema>;

export async function plagiarismCheck(
  input: PlagiarismCheckInput
): Promise<PlagiarismCheckOutput> {
  return plagiarismCheckFlow(input);
}

const PromptInputSchema = z.object({
    text: z.string().describe('The text to be checked for plagiarism.'),
});

const plagiarismCheckPrompt = ai.definePrompt({
  name: 'plagiarismCheckPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: PlagiarismCheckOutputSchema},
  prompt: `You are a highly skilled plagiarism detection expert. Your task is to analyze the following text and assess the likelihood that it contains plagiarized content from well-known sources like books, academic papers, news articles, and famous websites.

Analyze the provided text carefully. Based on your extensive knowledge, provide a plagiarism score from 0 to 100. A score of 0 means the text is completely original, while 100 means it is a direct copy of a known source. Set the 'isPlagiarized' field to true if the score is above 50.

Then, generate a concise report that explains your findings. In the report, identify any specific sentences or phrases that appear to be unoriginal. If possible, mention the likely source of the content.

Do not use external tools or access the internet. Base your entire analysis on the knowledge from your training data.

Text to analyze:
{{{text}}}
`,
});

const plagiarismCheckFlow = ai.defineFlow(
  {
    name: 'plagiarismCheckFlow',
    inputSchema: PlagiarismCheckInputSchema,
    outputSchema: PlagiarismCheckOutputSchema,
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
        return {
            plagiarismScore: 0,
            isPlagiarized: false,
            report: 'Input text was empty. Please provide text to check.',
        };
    }
    
    try {
        const {output} = await plagiarismCheckPrompt({ text: textToProcess });
        if (!output) {
            throw new Error("The model did not return any output.");
        }
        return output;
    } catch (e: any) {
        console.error("Error in plagiarismCheckFlow: ", e);
        throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
