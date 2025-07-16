
'use server';
/**
 * @fileOverview A concept explanation AI flow.
 *
 * - conceptExplainer - A function that breaks down a complex topic into simple, easy-to-understand steps.
 * - ConceptExplainerInput - The input type for the conceptExplainer function.
 * - ConceptExplainerOutput - The return type for the conceptExplainer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConceptExplainerInputSchema = z.object({
  topic: z.string().describe('The complex topic to be explained.'),
});
export type ConceptExplainerInput = z.infer<typeof ConceptExplainerInputSchema>;

const ConceptExplainerOutputSchema = z.object({
  title: z.string().describe('A catchy and clear title for the explanation.'),
  introduction: z.string().describe('A brief, simple, one-sentence introduction to the topic.'),
  steps: z
    .array(
      z.object({
        title: z.string().describe('The title of this specific step or sub-topic.'),
        explanation: z.string().describe('The detailed explanation for this step. Use simple terms, analogies, and keep it concise (2-3 sentences max).'),
        icon: z.string().describe("The name of a single, relevant Lucide icon (e.g., 'Brain', 'Atom', 'Code') that visually represents this step. Must be a valid icon name from `lucide-react`."),
      })
    )
    .min(3).max(6)
    .describe('An array of 3 to 6 steps breaking down the main topic.'),
});
export type ConceptExplainerOutput = z.infer<typeof ConceptExplainerOutputSchema>;

export async function conceptExplainer(
  input: ConceptExplainerInput
): Promise<ConceptExplainerOutput> {
  return conceptExplainerFlow(input);
}

const conceptExplainerPrompt = ai.definePrompt({
  name: 'conceptExplainerPrompt',
  input: {schema: ConceptExplainerInputSchema},
  output: {schema: ConceptExplainerOutputSchema},
  prompt: `You are 'Explain-It', an expert educator who makes complex topics simple and engaging. Your task is to break down a user's topic into a series of clear, concise, and visually supported steps.

Topic: '{{topic}}'

Follow these rules:
1.  **Title and Intro:** Create a main title for the topic and a single, engaging introductory sentence.
2.  **Break it Down:** Deconstruct the topic into 3 to 6 sequential steps. Each step must have a short title.
3.  **Explain Simply:** For each step, provide a simple explanation (2-3 sentences max). Use analogies and avoid jargon.
4.  **Find an Icon:** For each step, you MUST provide a valid icon name from the 'lucide-react' library that best represents the step's content. Choose simple, common icons. Examples: 'Atom', 'BookOpen', 'Code', 'TrendingUp', 'GitBranch', 'BrainCircuit'. Do not choose obscure icons.
5.  **Output Format:** Ensure your response strictly adheres to the JSON output schema.
`,
});

const conceptExplainerFlow = ai.defineFlow(
  {
    name: 'conceptExplainerFlow',
    inputSchema: ConceptExplainerInputSchema,
    outputSchema: ConceptExplainerOutputSchema,
  },
  async (input) => {
    if (!input.topic.trim()) {
        throw new Error('Topic is empty. Please provide a topic to explain.');
    }
    const {output} = await conceptExplainerPrompt(input);
    if (!output) {
        throw new Error("The model did not return any output.");
    }
    return output;
  }
);
