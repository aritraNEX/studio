
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
    -   **Flowchart/Graph Node Text MUST be in quotes**: For flowcharts, all descriptive text for a node MUST be enclosed in double quotes.
        -   **Correct:** \`A["This is the node text"]\`
        -   **INCORRECT:** \`A[This is the node text]\`
    -   **Node IDs MUST be simple**: For flowcharts, node IDs must be simple alphanumeric strings (e.g., \`A\`, \`B1\`). Do not use the descriptive text as an ID.
        -   **Correct:** \`A --> B\`
        -   **INCORRECT:** \`"Node A" --> "Node B"\`
    -   **Mindmap Format is DIFFERENT**: For mindmaps, you do not declare node IDs or use brackets/quotes for text. The structure is defined by indentation.
        -   **Correct Mindmap Node:** \`  Node Text\`
        -   **Correct Mindmap Node with parens:** \`  Topic (with details)\`
        -   **INCORRECT Mindmap Node:** \`  A["Node Text"]\` (This syntax is for flowcharts, do NOT use it for mindmaps)
4.  **Connect Nodes with Arrows ONLY (for Flowcharts/Graphs)**: You MUST use arrows like \`-->\` to show relationships. You can add text to connectors like this: \`A-- "description" -->B\`.
    -   **ABSOLUTELY DO NOT USE** the \`:::\` syntax to connect nodes. This is only for styling classes and is not for linking.
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
  },
  async (input) => {
    if (!input.topic.trim()) {
        throw new Error('Topic is empty. Please provide a topic for the diagram.');
    }
    
    try {
        const {output} = await diagramGeneratorPrompt(input);
        
        if (!output || !output.mermaidSyntax) {
            throw new Error("The model did not return any Mermaid syntax.");
        }

        return output;
    } catch (e: any) {
        console.error("Error in diagramGeneratorFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        throw new Error('An error occurred while generating the diagram. Please check your connection and try again.');
    }
  }
);
