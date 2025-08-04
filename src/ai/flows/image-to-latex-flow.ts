
'use server';
/**
 * @fileOverview An AI flow for converting images of formulas to LaTeX.
 *
 * - imageToLatex - A function that takes an image and returns LaTeX code.
 * - ImageToLatexInput - The input type for the imageToLatex function.
 * - ImageToLatexOutput - The return type for the imageToLatex function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToLatexInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "An image of a mathematical formula, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToLatexInput = z.infer<typeof ImageToLatexInputSchema>;

const ImageToLatexOutputSchema = z.object({
  latex: z
    .string()
    .describe(
      'The LaTeX code for the formula found in the image. The code should be wrapped in $$...$$ for display mode.'
    ),
});
export type ImageToLatexOutput = z.infer<typeof ImageToLatexOutputSchema>;

export async function imageToLatex(
  input: ImageToLatexInput
): Promise<ImageToLatexOutput> {
  return imageToLatexFlow(input);
}

const imageToLatexPrompt = ai.definePrompt({
  name: 'imageToLatexPrompt',
  input: {schema: ImageToLatexInputSchema},
  output: {schema: ImageToLatexOutputSchema},
  prompt: `You are an expert in optical character recognition, specializing in mathematical formulas. Your task is to analyze the provided image, identify any mathematical formulas within it, and convert them into a single, clean LaTeX string.

- The output must be valid LaTeX code.
- Enclose the entire formula in display mode delimiters ($$...$$).
- Do not include any explanatory text, comments, or anything other than the LaTeX code in the 'latex' field.

Image to process: {{media url=imageUrl}}`,
});

const imageToLatexFlow = ai.defineFlow(
  {
    name: 'imageToLatexFlow',
    inputSchema: ImageToLatexInputSchema,
    outputSchema: ImageToLatexOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await imageToLatexPrompt(input);
        if (!output) {
            throw new Error("The model did not return any LaTeX code.");
        }
        return output;
    } catch (e: any) {
        console.error("Error in imageToLatexFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        throw new Error('An error occurred while converting the image to LaTeX. Please try again.');
    }
  }
);
