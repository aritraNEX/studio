
'use server';
/**
 * @fileOverview A flashcard generation AI flow.
 *
 * - flashcardGenerator - A function that creates flashcards from a block of text.
 * - FlashcardGeneratorInput - The input type for the flashcardGenerator function.
 * - FlashcardGeneratorOutput - The return type for the flashcardGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processImageText } from './paraphrase-image-text';

const FlashcardGeneratorInputObject = z.object({
  text: z.string().describe('The source text from which to generate flashcards.').optional(),
  fileUrl: z.string().describe('A file to be processed, as a data URI.').optional(),
});

const FlashcardGeneratorInputSchema = FlashcardGeneratorInputObject.refine(data => data.fileUrl || data.text, {
    message: "Either fileUrl or text must be provided.",
});

export type FlashcardGeneratorInput = z.infer<typeof FlashcardGeneratorInputSchema>;

const FlashcardGeneratorOutputSchema = z.object({
  flashcards: z
    .array(
      z.object({
        front: z.string().describe('The front of the flashcard, typically a key term or a question.'),
        back: z.string().describe('The back of the flashcard, containing the definition or answer.'),
      })
    )
    .describe('An array of generated flashcards.'),
});
export type FlashcardGeneratorOutput = z.infer<typeof FlashcardGeneratorOutputSchema>;

export async function flashcardGenerator(
  input: FlashcardGeneratorInput
): Promise<FlashcardGeneratorOutput> {
  return flashcardGeneratorFlow(input);
}

const PromptInputSchema = z.object({
    text: z.string().describe('The source text from which to generate flashcards.'),
});

const flashcardGeneratorPrompt = ai.definePrompt({
  name: 'flashcardGeneratorPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: FlashcardGeneratorOutputSchema},
  prompt: `You are an expert at creating study materials. Your task is to analyze the following text and generate a set of flashcards for studying.

1.  Read the text carefully and identify the most important key terms, concepts, and factual information.
2.  For each key piece of information, create a flashcard with a 'front' and a 'back'.
3.  The 'front' should contain a concise question or a key term.
4.  The 'back' should contain the corresponding answer or definition.
5.  Ensure the question-answer pairs are clear, concise, and directly derived from the provided text.
6.  Generate at least 5 flashcards, but no more than 20, focusing on the most critical information.

Text to analyze:
{{{text}}}
`,
});

const flashcardGeneratorFlow = ai.defineFlow(
  {
    name: 'flashcardGeneratorFlow',
    inputSchema: FlashcardGeneratorInputSchema,
    outputSchema: FlashcardGeneratorOutputSchema,
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
      return { flashcards: [] };
    }
    
    try {
        const {output} = await flashcardGeneratorPrompt({ text: textToProcess });
        if (!output) {
            throw new Error("The model did not return any output.");
        }
        return output;
    } catch (e: any) {
        console.error("Error in flashcardGeneratorFlow: ", e);
        throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
