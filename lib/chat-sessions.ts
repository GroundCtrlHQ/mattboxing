import { getDb } from './db';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any;
  tool_results?: any;
  video_recommendations?: string[];
}

/**
 * Create or get a chat session
 */
export async function getOrCreateSession(sessionId: string, userId?: string) {
  const sql = getDb();
  
  const sessions = await sql`
    SELECT * FROM chat_sessions
    WHERE session_id = ${sessionId}
    LIMIT 1
  `;

  if (sessions.length > 0) {
    return sessions[0];
  }

  // Create new session
  const newSession = await sql`
    INSERT INTO chat_sessions (session_id, user_id)
    VALUES (${sessionId}, ${userId || null})
    RETURNING *
  `;

  return newSession[0];
}

/**
 * Sanitize content for database storage
 * Removes null bytes and control characters that PostgreSQL can't handle
 */
function sanitizeContent(content: string): string {
  return content
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F]/g, ''); // Remove control chars except \n, \t, \r
}

/**
 * Save a chat message
 */
export async function saveMessage(
  sessionId: string,
  message: ChatMessage
) {
  const sql = getDb();

  // Sanitize content to prevent database errors
  const sanitizedContent = message.content ? sanitizeContent(message.content) : '';

  await sql`
    INSERT INTO chat_messages (
      session_id,
      role,
      content,
      tool_calls,
      tool_results,
      video_recommendations
    ) VALUES (
      ${sessionId},
      ${message.role},
      ${sanitizedContent},
      ${message.tool_calls ? JSON.stringify(message.tool_calls) : null},
      ${message.tool_results ? JSON.stringify(message.tool_results) : null},
      ${message.video_recommendations ? message.video_recommendations : null}
    )
  `;
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string, limit = 50) {
  const sql = getDb();

  const messages = await sql`
    SELECT 
      role,
      content,
      tool_calls,
      tool_results,
      video_recommendations,
      created_at
    FROM chat_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;

  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    tool_calls: msg.tool_calls,
    tool_results: msg.tool_results,
    video_recommendations: msg.video_recommendations,
  }));
}

/**
 * Update session metadata
 */
export async function updateSession(sessionId: string, updates: { category?: string }) {
  const sql = getDb();

  await sql`
    UPDATE chat_sessions
    SET 
      category = ${updates.category || null},
      updated_at = NOW()
    WHERE session_id = ${sessionId}
  `;
}

/**
 * Get all chat sessions (for sidebar)
 */
export async function getAllSessions(limit = 50) {
  const sql = getDb();

  const sessions = await sql`
    SELECT 
      cs.session_id,
      cs.category,
      cs.created_at,
      cs.updated_at,
      (
        SELECT content 
        FROM chat_messages 
        WHERE session_id = cs.session_id 
        AND role = 'user' 
        ORDER BY created_at ASC 
        LIMIT 1
      ) as first_message,
      (
        SELECT COUNT(*) 
        FROM chat_messages 
        WHERE session_id = cs.session_id
      ) as message_count
    FROM chat_sessions cs
    ORDER BY cs.updated_at DESC
    LIMIT ${limit}
  `;

  return sessions.map(s => ({
    session_id: s.session_id,
    category: s.category,
    created_at: s.created_at,
    updated_at: s.updated_at,
    first_message: s.first_message,
    message_count: s.message_count,
  }));
}

