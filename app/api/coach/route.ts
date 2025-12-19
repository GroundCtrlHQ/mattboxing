import { NextRequest, NextResponse } from 'next/server';
import { getCoachingResponse, type CoachingContext, type ChatMessage } from '@/lib/openrouter';

export const runtime = 'nodejs'; // Required for streaming

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body as {
      messages: Array<{ role: string; content: string }>;
      context?: CoachingContext;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Convert to ChatMessage format
    const chatMessages: ChatMessage[] = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Stream the response directly - tools are handled in getCoachingResponse
    const response = await getCoachingResponse(chatMessages, context);
    
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('[Coach API] Error:', error);
    const errorMessage = error.message || 'Failed to get coaching response';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
