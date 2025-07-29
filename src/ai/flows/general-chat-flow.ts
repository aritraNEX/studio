
'use server';
/**
 * @fileOverview A general-purpose conversational AI flow.
 *
 * - generalChat - A function that provides a conversational response to a user query.
 * - GeneralChatInput - The input type for the generalChat function.
 * - GeneralChatOutput - The return type for the generalChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleSearch } from '@/ai/tools/google-search-tool';

const GeneralChatInputSchema = z.object({
  query: z.string().describe('The user\'s question or message.'),
});
export type GeneralChatInput = z.infer<typeof GeneralChatInputSchema>;

const GeneralChatOutputSchema = z.object({
  answer: z.string().describe('A helpful and conversational answer to the user\'s query.'),
});
export type GeneralChatOutput = z.infer<typeof GeneralChatOutputSchema>;

export async function generalChat(
  input: GeneralChatInput
): Promise<GeneralChatOutput> {
  return generalChatFlow(input);
}

const generalChatPrompt = ai.definePrompt({
  name: 'generalChatPrompt',
  input: {schema: GeneralChatInputSchema},
  output: {schema: GeneralChatOutputSchema},
  tools: [googleSearch],
  prompt: `You are Vesper, a friendly and highly intelligent AI assistant. Your goal is to provide helpful, accurate, and conversational answers to user questions.

1.  Analyze the user's query: '{{query}}'.
2.  If the query requires up-to-date information or knowledge about specific entities, use the 'googleSearch' tool to get information from the web.
3.  Synthesize the information from your knowledge and the search results to formulate a comprehensive and easy-to-understand answer.
4.  Your response should be in a conversational tone. Be friendly, but also authoritative and trustworthy.
5.  Place your final answer in the 'answer' field of the JSON output. Do not add any extra commentary.
`,
});

const generalChatFlow = ai.defineFlow(
  {
    name: 'generalChatFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async (input) => {
    if (!input.query.trim()) {
        throw new Error('Query cannot be empty.');
    }
    
    try {
        const {output} = await generalChatPrompt(input);
        if (!output) {
            throw new Error("The model did not return any output.");
        }
        return output;
    } catch (e: any) {
        console.error("Error in generalChatFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        throw new Error('An error occurred while getting your answer. Please try again.');
    }
  }
);
