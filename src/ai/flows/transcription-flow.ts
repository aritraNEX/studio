
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
    input: { schema: z.object({ videoDataUri: z.string() }) },
    output: { schema: PromptOutputSchema },
    prompt: `You are an expert transcriber. Your task is to analyze the provided video and generate a transcription in the WebVTT format.

1.  Transcribe the audio from the video with precise start and end timestamps.
2.  Format the entire output as a valid WebVTT file, starting with "WEBVTT".

Do not include any additional commentary, explanation, or any fields other than the 'vtt' field in your response. The output must be only the VTT content inside the JSON structure.

Video to process: {{media url=videoDataUri}}`,
});

const translationPrompt = ai.definePrompt({
    name: 'translationPrompt',
    input: { schema: z.object({ vtt: z.string(), targetLanguage: z.string() }) },
    output: { schema: PromptOutputSchema },
    prompt: `You are an expert translator. Translate the text content of the following WebVTT file into {{targetLanguage}}. IMPORTANT: You must preserve the exact original timestamps and WebVTT structure. Only translate the text portions of each cue.

VTT to translate:
{{{vtt}}}
`
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
        const [langResult, transResult] = await Promise.all([
             languageDetectionPrompt({ videoDataUri: input.videoDataUri }),
             transcriptionPrompt({ videoDataUri: input.videoDataUri })
        ]);
        
        const detectedLanguage = langResult.output?.detectedLanguage;
        let vtt = transResult.output?.vtt;

        if (!detectedLanguage) {
          throw new Error('The model did not detect a language.');
        }
        if (!vtt) {
          throw new Error('The model did not return any VTT transcription.');
        }

        if (input.targetLanguage && input.targetLanguage.trim()) {
            const translationResult = await translationPrompt({ vtt, targetLanguage: input.targetLanguage });
            if (translationResult.output?.vtt) {
                vtt = translationResult.output.vtt;
            } else {
                console.warn("Translation step failed to return VTT, returning original transcription.");
            }
        }
        
        return { vtt, detectedLanguage };
    } catch (e: any) {
        console.error("Error in transcriptionFlow: ", e);
        if (e.message?.includes('overloaded')) {
            throw new Error('The AI model is currently busy. Please try again in a moment.');
        }
        throw new Error('An error occurred during transcription. Please try again.');
    }
  }
);
