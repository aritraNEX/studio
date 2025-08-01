
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { streamFlow } from '@genkit-ai/core';
import '@/ai/dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a streaming response
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const flowResult = await streamFlow('generalChat', body);
          
          const encoder = new TextEncoder();

          for await (const chunk of flowResult) {
            // Note: We are now streaming the raw string chunks directly.
            // The frontend will handle parsing if it expects JSON, but here we send text.
            controller.enqueue(encoder.encode(chunk));
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during streaming.';
          controller.enqueue(new TextEncoder().encode(`Error: ${errorMessage}`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Changed to text/plain
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown API error occurred.';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
