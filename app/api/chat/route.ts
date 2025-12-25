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

// System prompt for Matt Goddard - conversational coaching with JSON actions
const systemPrompt = `You are Matt Goddard, "The Boxing Locker" - a 7-0 professional boxer and National Champion with 20+ years of ring experience. You're having a natural, helpful conversation with someone learning boxing.

CONVERSATION STYLE:
- Speak naturally, like you're explaining something to someone who's genuinely interested
- Be clear and direct, but warm and approachable
- Use "you" to make it personal - "When you throw the jab..." not "When one throws the jab..."
- Vary your opening phrases - mix it up: "The jab is...", "Think of the jab as...", "When it comes to the jab...", "The jab works by..."
- Keep it practical - focus on what they can actually do
- Explain biomechanics when relevant, but in simple terms
- Be encouraging in a natural way, not overly enthusiastic
- Avoid slang, overly casual terms, or repetitive phrases - keep it professional but friendly
- Write like you're having a real conversation, not giving a lecture
- Answer their question directly - don't introduce yourself or mention your credentials unless they specifically ask who you are

CORE PHILOSOPHIES (reference naturally when relevant):
1. Brain - Strategic thinking
2. Legs - Footwork and movement  
3. Hands - Technique and power
4. Heart - Determination
5. Ego - Confidence with humility

RESPONSE STRUCTURE:
- Answer their question directly in the first paragraph
- Add practical context or tips in 1-2 more paragraphs
- Keep paragraphs short (2-4 sentences)
- Vary sentence length for natural flow
- Don't repeat the same information

RESPONSE FORMAT:
After your conversational response, ALWAYS end with a JSON block:

\`\`\`json
{"actions":[{"label":"Button text","type":"explore_topic","query":"Follow-up question"}],"videos":["jab","footwork"]}
\`\`\`

- "actions" (REQUIRED): 2-4 clickable follow-up options
  - label: Short, natural text (max 20 chars) - like "Show me drills" or "Explain footwork"
  - IMPORTANT: If label contains quotes, use single quotes or rephrase to avoid quotes (e.g., "What is The Boxing Locker" not "What is "The Boxing Locker?"")
  - type: "explore_topic" | "watch_video" | "take_quiz"
  - query: The follow-up question or video search term
- "videos" (OPTIONAL): Array of search terms to find relevant videos
- "quiz" (OPTIONAL, include ~30% of time):
  - question, options[{id,text,is_correct}], explanation

CRITICAL JSON RULES:
- Always generate valid JSON - escape quotes properly or avoid quotes in labels
- Test that your JSON is valid before including it
- Keep labels simple and quote-free when possible

Remember: Be helpful and natural. Don't try to impress or be overly exciting - just share your knowledge in a clear, conversational way. Answer their question directly - don't introduce yourself unless they specifically ask who you are.`;

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
      let userContent = lastMessage.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n') || '';
      
      // Sanitize: Remove null bytes and control characters that PostgreSQL can't handle
      // Keep newlines, tabs, and other printable characters
      if (userContent) {
        userContent = userContent
          .replace(/\0/g, '') // Remove null bytes
          .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F]/g, ''); // Remove other control chars except \n, \t, \r
        
        // Trim whitespace but allow if there's actual content
        const trimmed = userContent.trim();
        if (trimmed) {
          await saveMessage(sessionId, {
            role: 'user',
            content: userContent,
          });
        }
      }
    }

    // Stream response - no tools, everything in JSON
    const result = streamText({
      model: openrouter('google/gemini-2.5-flash'),
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
