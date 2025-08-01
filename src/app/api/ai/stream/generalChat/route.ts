
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
          // Use your specific flow name
          const flowResult = await streamFlow('generalChat', body);
          
          const encoder = new TextEncoder();

          // Handle the streaming response
          for await (const chunk of flowResult.stream) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
