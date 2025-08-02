
'use server';

import { NextRequest } from 'next/server';
import { streamFlow } from '@genkit-ai/core';
import '@/ai/dev'; // Make sure to import the file that defines your flows

// This route uses the Genkit streamFlow helper to handle the streaming API.
// It connects the 'generalChat' flow to this endpoint.
export async function POST(request: NextRequest) {
  const body = await request.json();

  // The streamFlow helper manages the entire streaming process.
  return streamFlow('generalChat', body);
}
