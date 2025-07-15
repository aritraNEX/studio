'use server';
/**
 * @fileOverview A flow for generating and translating video subtitles.
 *
 * - generateSubtitles - A function that transcribes a video and generates subtitles in VTT format, with optional translation.
 * - GenerateSubtitlesInput - The input type for the generateSubtitles function.
 * - GenerateSubtitlesOutput - The return type for the generateSubtitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSubtitlesInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetLanguage: z
    .string()
    .optional()
    .describe('An optional target language to translate the subtitles into.'),
});
export type GenerateSubtitlesInput = z.infer<typeof GenerateSubtitlesInputSchema>;

const GenerateSubtitlesOutputSchema = z.object({
  vtt: z
    .string()
    .describe(
      'The generated subtitles in WebVTT format. This includes timestamps and text for each subtitle cue.'
    ),
    detectedLanguage: z.string().describe('The language detected in the video.')
});
export type GenerateSubtitlesOutput = z.infer<typeof GenerateSubtitlesOutputSchema>;

export async function generateSubtitles(
  input: GenerateSubtitlesInput
): Promise<GenerateSubtitlesOutput> {
  return subtitleFlow(input);
}

const subtitlePrompt = ai.definePrompt({
  name: 'subtitlePrompt',
  input: {schema: GenerateSubtitlesInputSchema},
  output: {schema: GenerateSubtitlesOutputSchema},
  prompt: `You are an expert transcriber and translator. Your task is to analyze the provided video and generate subtitles in the WebVTT format.

1.  First, identify the primary language spoken in the video and place it in the 'detectedLanguage' field.
2.  Transcribe the audio from the video with precise start and end timestamps.
3.  Format the entire output as a valid WebVTT file, starting with "WEBVTT".
{{#if targetLanguage}}
4.  After transcribing, translate the text for each subtitle cue into {{targetLanguage}}. The timestamps must remain the same as the original transcription.
{{/if}}

Do not include any additional commentary or explanation in your response. The output must be only the WebVTT content and the detected language.

Video to process: {{media url=videoDataUri}}`,
});

const subtitleFlow = ai.defineFlow(
  {
    name: 'subtitleFlow',
    inputSchema: GenerateSubtitlesInputSchema,
    outputSchema: GenerateSubtitlesOutputSchema,
  },
  async (input) => {
    const {output} = await subtitlePrompt(input);
    if (!output) {
      throw new Error('The model did not return any output.');
    }
    return output;
  }
);
