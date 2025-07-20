
'use server';
/**
 * @fileOverview A research assistant AI flow for fact-checking and citation generation.
 *
 * - researchAssistant - A function that analyzes text for claims, fact-checks them, and generates citations.
 * - ResearchAssistantInput - The input type for the researchAssistant function.
 * - ResearchAssistantOutput - The return type for the researchAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {setTrialUsed} from '@/lib/firebase-admin';

const ResearchAssistantInputSchema = z.object({
  text: z.string().describe('The text containing claims to be fact-checked and cited.'),
});
export type ResearchAssistantInput = z.infer<typeof ResearchAssistantInputSchema>;

const ResearchAssistantOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'A detailed report analyzing the claims in the text, assessing their accuracy based on your internal knowledge.'
    ),
  citations: z
    .array(z.string())
    .describe(
      'A list of citations for the information verified in the text, formatted in APA style.'
    ),
});
export type ResearchAssistantOutput = z.infer<typeof ResearchAssistantOutputSchema>;

export async function researchAssistant(
  input: ResearchAssistantInput
): Promise<ResearchAssistantOutput> {
  return researchAssistantFlow(input);
}

const researchAssistantPrompt = ai.definePrompt({
  name: 'researchAssistantPrompt',
  input: {schema: ResearchAssistantInputSchema},
  output: {schema: ResearchAssistantOutputSchema},
  prompt: `You are a meticulous research assistant. Your task is to analyze the provided text, identify all factual claims, and verify their accuracy based on your extensive training data.

First, produce a comprehensive report in the 'report' field. In this report, break down each claim, state whether it is accurate, partially accurate, or inaccurate, and provide a brief explanation for your assessment.

Second, for each accurate claim you can verify, generate a citation in APA format in the 'citations' array. These citations should point to plausible, well-known sources (like academic journals, reputable news organizations, or established scientific bodies) where the information could be found. Do not invent sources. If you cannot confidently attribute a claim to a source, do not create a citation for it.

Base your entire analysis on your internal knowledge. Do not use external tools.

Text to analyze:
{{{text}}}
`,
});

const researchAssistantFlow = ai.defineFlow(
  {
    name: 'researchAssistantFlow',
    inputSchema: ResearchAssistantInputSchema,
    outputSchema: ResearchAssistantOutputSchema,
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
    if (!input.text.trim()) {
        return {
            report: 'Input text was empty. Please provide text to analyze.',
            citations: [],
        };
    }
    const {output} = await researchAssistantPrompt(input);
    if (!output) {
        throw new Error("The model did not return any output.");
    }
    return output;
  }
);
