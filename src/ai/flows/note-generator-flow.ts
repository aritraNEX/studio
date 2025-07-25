
'use server';
/**
 * @fileOverview A note generation AI flow for students.
 *
 * - noteGenerator - A function that generates notes on a given topic.
 * - NoteGeneratorInput - The input type for the noteGenerator function.
 * - NoteGeneratorOutput - The return type for the noteGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NoteGeneratorInputSchema = z.object({
  topic: z.string().describe('The topic for the notes.'),
  instructions: z.string().optional().describe('Optional instructions for the note generation, like tone, focus areas, or specific concepts to include.'),
});
export type NoteGeneratorInput = z.infer<typeof NoteGeneratorInputSchema>;

const NoteGeneratorOutputSchema = z.object({
  title: z.string().describe('A suitable title for the notes.'),
  content: z.string().describe('The main body of the notes, written in a clear, structured, and point-wise manner. Key terms, definitions, and answers should be enclosed in double asterisks for bolding (e.g., **this is bold**).'),
});
export type NoteGeneratorOutput = z.infer<typeof NoteGeneratorOutputSchema>;

export async function noteGenerator(
  input: NoteGeneratorInput
): Promise<NoteGeneratorOutput> {
  return noteGeneratorFlow(input);
}

const noteGeneratorPrompt = ai.definePrompt({
  name: 'noteGeneratorPrompt',
  input: {schema: NoteGeneratorInputSchema},
  output: {schema: NoteGeneratorOutputSchema},
  prompt: `You are 'Note-mentor', an expert academic assistant who creates high-quality, structured study notes for graduate students.

Your task is to generate comprehensive notes on the user's topic: '{{topic}}'.

Follow these instructions precisely:
1.  **Analyze the Topic**: Deeply understand the core concepts of '{{topic}}'.
2.  **Adhere to Instructions**: If the user has provided specific instructions, follow them. Instructions: '{{#if instructions}}{{instructions}}{{else}}None{{/if}}'.
3.  **Structure the Notes**: Organize the content logically with clear headings and sub-points. Use a combination of paragraphs and bullet points for clarity.
4.  **Highlight Key Information**: This is critical. Identify the most important information, such as key terms, definitions, formulas, or answers to implicit questions. Enclose these crucial pieces of text in double asterisks to make them bold (e.g., "The powerhouse of the cell is the **mitochondria**."). This helps the student quickly identify what's important.
5.  **Generate a Title**: Create a clear and concise title for the notes.
6.  **Output Format**: The final output must be in the specified JSON format. The 'content' field should contain the full, Markdown-formatted notes.
`,
});

const noteGeneratorFlow = ai.defineFlow(
  {
    name: 'noteGeneratorFlow',
    inputSchema: NoteGeneratorInputSchema,
    outputSchema: NoteGeneratorOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await noteGeneratorPrompt(input);
        if (!output) {
            throw new Error("The model did not return any output.");
        }
        return output;
    } catch (e: any) {
        console.error("Error in noteGeneratorFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        // Re-throw other errors as a generic user-friendly message
        throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
