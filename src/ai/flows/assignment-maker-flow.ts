
'use server';
/**
 * @fileOverview An assignment making AI flow.
 *
 * - assignmentMaker - A function that generates an assignment on a given topic.
 * - AssignmentMakerInput - The input type for the assignmentMaker function.
 * - AssignmentMakerOutput - The return type for the assignmentMaker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleSearch } from '@/ai/tools/google-search-tool';

const AssignmentMakerInputSchema = z.object({
  topic: z.string().describe('The topic for the assignment.'),
  instructions: z.string().optional().describe('Optional instructions for the assignment generation, like tone, focus areas, or required number of references.'),
});
export type AssignmentMakerInput = z.infer<typeof AssignmentMakerInputSchema>;

const AssignmentMakerOutputSchema = z.object({
  title: z.string().describe('A suitable title for the assignment.'),
  content: z.string().describe('The main body of the assignment, written in a clear and structured manner.'),
  references: z.array(z.string()).describe('A list of sources or references used to generate the assignment.'),
});
export type AssignmentMakerOutput = z.infer<typeof AssignmentMakerOutputSchema>;

export async function assignmentMaker(
  input: AssignmentMakerInput
): Promise<AssignmentMakerOutput> {
  return assignmentMakerFlow(input);
}

const assignmentMakerPrompt = ai.definePrompt({
  name: 'assignmentMakerPrompt',
  input: {schema: AssignmentMakerInputSchema},
  output: {schema: AssignmentMakerOutputSchema},
  tools: [googleSearch],
  prompt: `You are 'Assign-mentor', an expert academic assistant. Your task is to create a brief, well-researched assignment on a given topic for a student or teacher.

Follow these steps:
1.  Analyze the user's topic: '{{topic}}'.
2.  If the user has provided additional instructions, adhere to them strictly. Instructions: '{{#if instructions}}{{instructions}}{{else}}None{{/if}}'.
3.  Use the 'googleSearch' tool to find reliable information, articles, and data about the topic. Access to Wikipedia and the broader internet is critical. Prioritize academic sources, reputable news outlets, and well-regarded educational websites.
4.  Synthesize the gathered information into a coherent, well-structured assignment. The content should be informative, easy to understand, and directly address the topic.
5.  Generate a suitable title for the assignment.
6.  List all the sources you used in the 'references' array. Format them clearly.

The final output must be in the specified JSON format. Do not add any commentary outside of the JSON structure.
`,
});

const assignmentMakerFlow = ai.defineFlow(
  {
    name: 'assignmentMakerFlow',
    inputSchema: AssignmentMakerInputSchema,
    outputSchema: AssignmentMakerOutputSchema,
  },
  async (input) => {
    const {output} = await assignmentMakerPrompt(input);
    if (!output) {
        throw new Error("The model did not return any output.");
    }
    return output;
  }
);
