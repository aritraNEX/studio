/**
 * @fileoverview This is the API route handler for all Genkit flows.
 * It uses the Genkit Next.js plugin to automatically handle requests
 * and route them to the appropriate flow.
 */

import {genkitNextHandler} from '@genkit-ai/next';
import '@/ai/dev'; // Make sure to import the file that defines your flows.

export const POST = genkitNextHandler();
