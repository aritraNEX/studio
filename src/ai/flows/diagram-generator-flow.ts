
'use server';
/**
 * @fileOverview An AI flow for generating diagrams from a topic.
 *
 * - diagramGenerator - A function that generates Mermaid syntax for a diagram.
 * - DiagramGeneratorInput - The input type for the diagramGenerator function.
 * - DiagramGeneratorOutput - The return type for the diagramGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {setTrialUsed} from '@/lib/firebase-admin';

const DiagramGeneratorInputSchema = z.object({
  topic: z.string().describe('The topic for the diagram.'),
  diagramType: z.enum(['flowchart', 'mindmap', 'concept', 'timeline']).describe('The type of diagram to generate.'),
});
export type DiagramGeneratorInput = z.infer<typeof DiagramGeneratorInputSchema>;

const DiagramGeneratorOutputSchema = z.object({
  mermaidSyntax: z
    .string()
    .describe(
      'The complete and valid Mermaid.js syntax for the requested diagram. This syntax should be directly renderable by the Mermaid library.'
    ),
});
export type DiagramGeneratorOutput = z.infer<typeof DiagramGeneratorOutputSchema>;

export async function diagramGenerator(
  input: DiagramGeneratorInput
): Promise<DiagramGeneratorOutput> {
  return diagramGeneratorFlow(input);
}

const diagramGeneratorPrompt = ai.definePrompt({
  name: 'diagramGeneratorPrompt',
  input: {schema: DiagramGeneratorInputSchema},
  output: {schema: DiagramGeneratorOutputSchema},
  prompt: `You are an expert diagram creator. Your task is to generate a Mermaid.js syntax for a given topic and diagram type.

Topic: '{{topic}}'
Diagram Type: '{{diagramType}}'

Follow these instructions precisely:
1.  Analyze the topic to understand its key components, relationships, and structure.
2.  Based on the requested diagram type, create a comprehensive and accurate diagram.
    -   For a 'flowchart', show a process or sequence of steps. Use standard flowchart shapes.
    -   For a 'mindmap', start with a central idea and branch out into related concepts. Keep it hierarchical.
    -   For a 'concept' diagram, show the relationships and connections between different ideas or entities.
    -   For a 'timeline', represent key events or milestones in chronological order.
3.  Generate the complete and valid Mermaid.js syntax for this diagram. The syntax MUST start with the correct diagram type declaration (e.g., 'graph TD', 'mindmap', 'timeline').
4.  IMPORTANT: When defining nodes, do NOT use special characters like parentheses () in the node IDs. For example, use 'node_id' instead of 'node(id)'.
5.  Ensure the syntax is clean, well-structured, and immediately renderable by the Mermaid.js library. Do not include any explanatory text, comments, or Markdown formatting like \`\`\`mermaid ... \`\`\`.
6.  Place the final, raw Mermaid syntax directly into the 'mermaidSyntax' field of the JSON output.
`,
});

const diagramGeneratorFlow = ai.defineFlow(
  {
    name: 'diagramGeneratorFlow',
    inputSchema: DiagramGeneratorInputSchema,
    outputSchema: DiagramGeneratorOutputSchema,
    auth: {
      required: true,
      policy(auth, input) {
        if (!auth.isPremium) {
           setTrialUsed(auth.uid);
        }
      }
    }
  },
  async (input) => {
    if (!input.topic.trim()) {
        throw new Error('Topic is empty. Please provide a topic for the diagram.');
    }
    const {output} = await diagramGeneratorPrompt(input);
    if (!output || !output.mermaidSyntax) {
        throw new Error("The model did not return any Mermaid syntax.");
    }
    return output;
  }
);
