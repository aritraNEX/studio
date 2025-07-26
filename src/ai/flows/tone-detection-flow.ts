
'use server';
/**
 * @fileOverview A tone detection AI flow.
 *
 * - toneDetection - A function that analyzes text to determine its tones.
 * - ToneDetectionInput - The input type for the toneDetection function.
 * - ToneDetectionOutput - The return type for the toneDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { processImageText } from './paraphrase-image-text';

const ToneDetectionInputObject = z.object({
  text: z.string().describe('The text to be analyzed for tone.').optional(),
  fileUrl: z.string().describe('A file to be processed, as a data URI.').optional(),
});

const ToneDetectionInputSchema = ToneDetectionInputObject.refine(data => data.fileUrl || data.text, {
    message: "Either fileUrl or text must be provided.",
});

export type ToneDetectionInput = z.infer<typeof ToneDetectionInputSchema>;

const ToneDetectionOutputSchema = z.object({
  tones: z
    .array(
      z.object({
        tone: z.string().describe('The name of the detected tone (e.g., Formal, Confident, Friendly, Urgent).'),
        score: z.number().min(0).max(100).describe('A confidence score from 0 to 100 for the detected tone.'),
        explanation: z.string().describe('A brief explanation for why this tone was detected.'),
      })
    )
    .min(3)
    .max(5)
    .describe('An array of the top 3-5 detected tones.'),
});
export type ToneDetectionOutput = z.infer<typeof ToneDetectionOutputSchema>;

export async function toneDetection(
  input: ToneDetectionInput
): Promise<ToneDetectionOutput> {
  return toneDetectionFlow(input);
}

const PromptInputSchema = z.object({
    text: z.string().describe('The text to be analyzed for tone.'),
});

const toneDetectionPrompt = ai.definePrompt({
  name: 'toneDetectionPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: ToneDetectionOutputSchema},
  prompt: `You are an expert in communication and linguistic analysis. Your task is to analyze the provided text and identify its primary tones.

Analyze the following text:
"{{{text}}}"

Based on your analysis, identify the top 3 to 5 most prominent tones. For each tone, provide:
1.  **tone**: The name of the tone (e.g., Formal, Confident, Joyful, Anxious, Urgent, Friendly).
2.  **score**: A score from 0-100 indicating the confidence level of that tone being present.
3.  **explanation**: A concise, one-sentence explanation of what in the text suggests this tone.

Return the results in the specified JSON format.
`,
});

const toneDetectionFlow = ai.defineFlow(
  {
    name: 'toneDetectionFlow',
    inputSchema: ToneDetectionInputSchema,
    outputSchema: ToneDetectionOutputSchema,
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
      return { tones: [] };
    }
    
    try {
        const {output} = await toneDetectionPrompt({ text: textToProcess });
        if (!output || !output.tones) {
            return { tones: [] };
        }
        // Sort tones by score in descending order
        output.tones.sort((a, b) => b.score - a.score);
        return output;
    } catch (e: any) {
        console.error("Error in toneDetectionFlow: ", e);
        throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
