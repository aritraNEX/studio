
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
  prompt: `You are an expert diagram creator specializing in Mermaid.js syntax. Your task is to generate a complete and valid Mermaid.js diagram based on the user's topic and chosen diagram type.

Topic: '{{topic}}'
Diagram Type: '{{diagramType}}'

**CRITICAL INSTRUCTIONS - FOLLOW THESE EXACTLY:**

1.  **Analyze the Topic**: Understand the core components, relationships, and structure of the topic.
2.  **Choose the Correct Root Declaration**:
    -   For **flowchart**: Start with \`graph TD;\` (for top-to-bottom).
    -   For **mindmap**: Start with \`mindmap\`.
    -   For **concept**: Start with \`graph TD;\`.
    -   For **timeline**: Start with \`timeline\`.
3.  **Define Nodes Correctly (MOST IMPORTANT RULE)**:
    -   **Node Text MUST be in quotes**: All descriptive text for a node MUST be enclosed in double quotes.
        -   **Correct:** \`A["This is the node text"]\`
        -   **INCORRECT:** \`A[This is the node text]\`
    -   **Node IDs MUST NOT contain special characters**: Node IDs should be simple alphanumeric strings (e.g., \`A\`, \`B1\`, \`Node_1\`).
        -   **Correct:** \`A --> B\`
        -   **INCORRECT:** \`"Node A" --> "Node B"\` (Using full text as ID is wrong)
    -   **Mindmap Format is DIFFERENT**: For mindmaps, you do not declare node IDs. The structure is defined by indentation.
        -   **Correct Mindmap Node:** \`  Node Text\`
        -   **Correct Mindmap Node with parens:** \`  Topic (with details)\`
        -   **INCORRECT Mindmap Node:** \`  A["Node Text"]\` (This syntax is for flowcharts/graphs)
4.  **Connect Nodes Correctly (for flowcharts/graphs)**: Use arrows like \`-->\` to show relationships. You can add text to connectors like this: \`A-- "description" -->B\`.
5.  **Final Output**:
    -   The output must be ONLY the raw Mermaid syntax.
    -   Do NOT include any explanatory text, comments, or Markdown backticks like \`\`\`mermaid ... \`\`\`.
    -   Place the final, raw Mermaid syntax directly into the 'mermaidSyntax' field of the JSON output.

**Examples:**

*   **Flowchart Syntax:**
    \`\`\`
    graph TD;
        A["Start"] --> B["Process 1 (Check data)"];
        B --> C{"Decision"};
        C -- "Yes" --> D["End"];
        C -- "No" --> B;
    \`\`\`
*   **Mindmap Syntax:**
    \`\`\`
    mindmap
      root((Central Topic))
        Branch 1
          Sub-branch 1.1
          Sub-branch 1.2
        Branch 2 (A longer description)
    \`\`\`
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
