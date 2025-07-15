'use server';
/**
 * @fileOverview A flow for generating and translating video transcriptions.
 *
 * - generateTranscription - A function that transcribes a video and generates a transcription in VTT format, with optional translation.
 * - GenerateTranscriptionInput - The input type for the generateTranscription function.
 * - GenerateTranscriptionOutput - The return type for the generateTranscription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTranscriptionInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetLanguage: z
    .string()
    .optional()
    .describe('An optional target language to translate the transcription into.'),
});
export type GenerateTranscriptionInput = z.infer<typeof GenerateTranscriptionInputSchema>;

const GenerateTranscriptionOutputSchema = z.object({
  vtt: z
    .string()
    .describe(
      'The generated transcription in WebVTT format. This includes timestamps and text for each cue.'
    ),
    detectedLanguage: z.string().describe('The language detected in the video.')
});
export type GenerateTranscriptionOutput = z.infer<typeof GenerateTranscriptionOutputSchema>;

export async function generateTranscription(
  input: GenerateTranscriptionInput
): Promise<GenerateTranscriptionOutput> {
  return transcriptionFlow(input);
}

const transcriptionPrompt = ai.definePrompt({
  name: 'transcriptionPrompt',
  input: {schema: GenerateTranscriptionInputSchema},
  output: {schema: GenerateTranscriptionOutputSchema},
  prompt: `You are an expert transcriber and translator. Your task is to analyze the provided video and generate a transcription in the WebVTT format.

1.  First, identify the primary language spoken in the video and place it in the 'detectedLanguage' field.
2.  Transcribe the audio from the video with precise start and end timestamps.
3.  Format the entire output as a valid WebVTT file, starting with "WEBVTT".
{{#if targetLanguage}}
4.  After transcribing, translate the text for each cue into {{targetLanguage}}. The timestamps must remain the same as the original transcription.
{{/if}}

Do not include any additional commentary or explanation in your response. The output must be only the WebVTT content and the detected language.

Video to process: {{media url=videoDataUri}}`,
});

const transcriptionFlow = ai.defineFlow(
  {
    name: 'transcriptionFlow',
    inputSchema: GenerateTranscriptionInputSchema,
    outputSchema: GenerateTranscriptionOutputSchema,
  },
  async (input) => {
    const {output} = await transcriptionPrompt(input);
    if (!output) {
      throw new Error('The model did not return any output.');
    }
    return output;
  }
);
