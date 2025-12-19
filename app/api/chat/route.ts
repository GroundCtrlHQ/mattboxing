import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { getOrCreateSession, saveMessage, getChatHistory } from '@/lib/chat-sessions';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// System prompt for Matt Goddard - text response with JSON actions
const systemPrompt = `You are Matt Goddard, "The Boxing Locker" - a 7-0 professional boxer and National Champion with 20+ years of ring experience.

VOICE & TONE:
- British, direct, and technical
- "No-nonsense" yet highly motivational
- Focus on biomechanics and proper form

CORE PHILOSOPHIES:
1. Brain - Strategic thinking
2. Legs - Footwork and movement  
3. Hands - Technique and power
4. Heart - Determination
5. Ego - Confidence with humility

RESPONSE FORMAT:
Write your coaching response (2-3 paragraphs max), then end with a JSON block.

After your text, ALWAYS end with this JSON format:
\`\`\`json
{"actions":[{"label":"Button text","type":"explore_topic","query":"Follow-up question"}],"videos":["jab","footwork"]}
\`\`\`

- "actions" (REQUIRED): 2-4 clickable follow-up options
  - label: Short text (max 20 chars)
  - type: "explore_topic" | "watch_video" | "take_quiz"
  - query: The follow-up question or video search term
- "videos" (OPTIONAL): Array of search terms to find relevant videos
- "quiz" (OPTIONAL, include ~30% of time):
  - question, options[{id,text,is_correct}], explanation`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body as {
      messages: UIMessage[];
      sessionId: string;
    };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Ensure session exists
    await getOrCreateSession(sessionId);

    // Save user message (last message in array)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      const userContent = lastMessage.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n') || '';
      
      if (userContent) {
        await saveMessage(sessionId, {
          role: 'user',
          content: userContent,
        });
      }
    }

    // Stream response - no tools, everything in JSON
    const result = streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      
      onFinish: async ({ text }) => {
        // Save assistant response
        if (text) {
          await saveMessage(sessionId, {
            role: 'assistant',
            content: text,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

/**
 * Get chat history for a session or all sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const getAll = searchParams.get('getAll') === 'true';

    // If getAll=true, return all sessions
    if (getAll) {
      const { getAllSessions } = await import('@/lib/chat-sessions');
      const sessions = await getAllSessions(50);
      return NextResponse.json({ sessions });
    }

    // Otherwise, get history for a specific session
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const history = await getChatHistory(sessionId);
    
    // Convert to UI message format
    const uiMessages = history.map((msg, idx) => ({
      id: `msg-${idx}`,
      role: msg.role,
      parts: [{ type: 'text', text: msg.content }],
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({ messages: uiMessages });
  } catch (error: any) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get chat history' },
      { status: 500 }
    );
  }
}

/**
 * Delete a chat session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const { getDb } = await import('@/lib/db');
    const sql = getDb();

    await sql`DELETE FROM chat_messages WHERE session_id = ${sessionId}`;
    await sql`DELETE FROM chat_sessions WHERE session_id = ${sessionId}`;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}
