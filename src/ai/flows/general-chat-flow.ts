
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
  fileUrl: z
    .string()
    .describe(
      "An optional file (image, video, etc.) associated with the query, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ).optional(),
});
export type GeneralChatInput = z.infer<typeof GeneralChatInputSchema>;

const GeneralChatOutputSchema = z.object({
  answer: z.string().describe('A helpful and conversational answer to the user\'s query.'),
});
export type GeneralChatOutput = z.infer<typeof GeneralChatOutputSchema>;


const generalChat = ai.defineFlow(
    {
      name: 'generalChat',
      inputSchema: GeneralChatInputSchema,
      outputSchema: z.string(),
      stream: true,
    },
    async (input, stream) => {
        if (!input.query.trim() && !input.fileUrl) {
            throw new Error('Query cannot be empty.');
        }

        try {
            const llmResponse = await ai.generate({
                prompt: {
                    role: 'user',
                    content: [
                        { text: input.query },
                        ...(input.fileUrl ? [{ media: { url: input.fileUrl } }] : []),
                    ],
                },
                history: [
                {
                    role: 'system',
                    content: [
                    {
                        text: `You are Vesper, a friendly and highly intelligent AI assistant. Your goal is to provide helpful, accurate, and conversational answers to user questions. If the query requires up-to-date information or knowledge about specific entities, use the 'googleSearch' tool to get information from the web. Synthesize the information from your knowledge and the search results to formulate a comprehensive and easy-to-understand answer. Your response should be in a conversational tone. Be friendly, but also authoritative and trustworthy.`,
                    },
                    ],
                },
                ],
                tools: [googleSearch],
                model: 'googleai/gemini-1.5-flash-latest',
                stream: true,
            });

            for await (const chunk of llmResponse.stream) {
                if (chunk.content) {
                  stream.write(chunk.content[0].text);
                }
            }
        } catch (e: any) {
            console.error("Error in generalChat flow:", e);
            const errorMessage = e.message || 'An unexpected error occurred while processing the chat.';
             if (e.message?.includes('overloaded')) {
                throw new Error('The AI model is currently busy. Please try again in a moment.');
            }
            throw new Error(`AI processing failed: ${errorMessage}`);
        }
    }
);

// This is an exported wrapper to conform to the expected flow signature for non-streaming access if needed,
// but the primary use is via streaming. This function is not meant to be called directly in this app.
export async function generalChatFlow(input: GeneralChatInput): Promise<GeneralChatOutput> {
    let finalAnswer = '';
    const {stream} = await ai.runFlow(generalChat, input);
    for await (const chunk of stream) {
        finalAnswer += chunk;
    }
    return { answer: finalAnswer };
}
