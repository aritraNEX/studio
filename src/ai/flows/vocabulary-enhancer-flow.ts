
'use server';
/**
 * @fileOverview A vocabulary enhancement AI flow.
 *
 * - vocabularyEnhancer - A function that suggests word improvements in a text.
 * - VocabularyEnhancerInput - The input type for the vocabularyEnhancer function.
 * - VocabularyEnhancerOutput - The return type for the vocabularyEnhancer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processImageText } from './paraphrase-image-text';

const VocabularyEnhancerInputObject = z.object({
  text: z.string().describe('The text to be analyzed for vocabulary enhancement.').optional(),
  fileUrl: z.string().describe('A file to be processed, as a data URI.').optional(),
});

const VocabularyEnhancerInputSchema = VocabularyEnhancerInputObject.refine(data => data.fileUrl || data.text, {
    message: "Either fileUrl or text must be provided.",
});

export type VocabularyEnhancerInput = z.infer<typeof VocabularyEnhancerInputSchema>;

const VocabularyEnhancerOutputSchema = z.object({
  enhancedText: z.string().describe('The full original text provided by the user for context.'),
  suggestions: z
    .array(
      z.object({
        originalWord: z.string().describe('The original word from the text that can be improved.'),
        startIndex: z.number().describe('The starting index of the original word in the text.'),
        endIndex: z.number().describe('The ending index of the original word in the text.'),
        suggestions: z
          .array(
            z.object({
              word: z.string().describe('The suggested replacement word.'),
              reason: z.string().describe('A brief explanation of why this word is a good alternative (e.g., "more descriptive", "more formal").'),
            })
          )
          .min(1)
          .describe('A list of suggested alternative words.'),
      })
    )
    .describe('An array of vocabulary suggestions for the input text.'),
});
export type VocabularyEnhancerOutput = z.infer<typeof VocabularyEnhancerOutputSchema>;

export async function vocabularyEnhancer(
  input: VocabularyEnhancerInput
): Promise<VocabularyEnhancerOutput> {
  return vocabularyEnhancerFlow(input);
}

const PromptInputSchema = z.object({
    text: z.string().describe('The text to be analyzed for vocabulary enhancement.'),
});

const PromptOutputSchema = VocabularyEnhancerOutputSchema.omit({ enhancedText: true });


const vocabularyEnhancerPrompt = ai.definePrompt({
  name: 'vocabularyEnhancerPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: PromptOutputSchema},
  prompt: `You are an expert editor and writing coach. Your task is to analyze the provided text and suggest vocabulary enhancements to improve its quality, clarity, and impact.

Analyze the following text:
"{{{text}}}"

Follow these steps:
1.  Read the entire text to understand its context and tone.
2.  Identify words that are generic, overused, repetitive, or could be replaced with a more precise or impactful alternative.
3.  For each word you identify, you MUST provide its exact start and end index within the original text. This is critical for mapping.
4.  For each identified word, provide 1-3 alternative word suggestions.
5.  For each suggestion, provide a very brief, helpful reason (e.g., "more descriptive," "stronger verb," "more formal," "less repetitive").
6.  If the text is already well-written and has no obvious words to improve, return an empty 'suggestions' array.
7.  Return your findings in the specified JSON format. Ensure all indexes are correct.
`,
});

const vocabularyEnhancerFlow = ai.defineFlow(
  {
    name: 'vocabularyEnhancerFlow',
    inputSchema: VocabularyEnhancerInputSchema,
    outputSchema: VocabularyEnhancerOutputSchema,
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
      return { enhancedText: "", suggestions: [] };
    }

    try {
        const {output} = await vocabularyEnhancerPrompt({ text: textToProcess });
        if (!output || !output.suggestions) {
          return { enhancedText: textToProcess, suggestions: [] };
        }
        // Sort by start index to ensure proper processing order on the client
        output.suggestions.sort((a, b) => a.startIndex - b.startIndex);
        return {
          enhancedText: textToProcess,
          suggestions: output.suggestions,
        };
    } catch (e: any) {
        console.error("Error in vocabularyEnhancerFlow: ", e);
        throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
