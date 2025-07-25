
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

const PromptOutputSchema = z.object({
 vtt: z
    .string()
    .describe(
      'The generated transcription in WebVTT format. This includes timestamps and text for each cue.'
    ),
});

const transcriptionPrompt = ai.definePrompt({
  name: 'transcriptionPrompt',
  input: {schema: GenerateTranscriptionInputSchema},
  output: {schema: PromptOutputSchema},
  prompt: `You are an expert transcriber and translator. Your task is to analyze the provided video and generate a transcription in the WebVTT format.

1.  Transcribe the audio from the video with precise start and end timestamps.
2.  Format the entire output as a valid WebVTT file, starting with "WEBVTT".
{{#if targetLanguage}}
3.  After transcribing, translate the text for each cue into {{targetLanguage}}. The timestamps must remain the same as the original transcription.
{{/if}}

Do not include any additional commentary, explanation, or any fields other than the 'vtt' field in your response. The output must be only the VTT content inside the JSON structure.

Video to process: {{media url=videoDataUri}}`,
});

const languageDetectionPrompt = ai.definePrompt({
    name: 'languageDetectionPrompt',
    input: { schema: z.object({ videoDataUri: z.string() }) },
    output: { schema: z.object({ detectedLanguage: z.string() }) },
    prompt: `Analyze the audio from the provided video and identify the primary language spoken. Respond with only the name of the language. Video: {{media url=videoDataUri}}`
});


const transcriptionFlow = ai.defineFlow(
  {
    name: 'transcriptionFlow',
    inputSchema: GenerateTranscriptionInputSchema,
    outputSchema: GenerateTranscriptionOutputSchema,
  },
  async (input) => {
    try {
        // Run language detection first
        const languageResult = await languageDetectionPrompt({ videoDataUri: input.videoDataUri });
        const detectedLanguage = languageResult.output?.detectedLanguage;
        if (!detectedLanguage) {
          throw new Error('The model did not detect a language.');
        }
        
        // Then run transcription, potentially with translation
        const transcriptionResult = await transcriptionPrompt(input);
        const vtt = transcriptionResult.output?.vtt;
        if (!vtt) {
          throw new Error('The model did not return any VTT transcription.');
        }
        
        return { vtt, detectedLanguage };
    } catch (e: any) {
        console.error("Error in transcriptionFlow: ", e);
        throw new Error('The AI model is currently busy. Please try again.');
    }
  }
);
