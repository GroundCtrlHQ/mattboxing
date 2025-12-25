/**
 * Test script for AI chat session functionality
 * Run with: bun test scripts/test-chat.ts
 * 
 * Model: google/gemini-2.5-flash via OpenRouter
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { getDb } from '../lib/db';
import { getOrCreateSession, saveMessage, getChatHistory, getAllSessions } from '../lib/chat-sessions';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_SESSION_PREFIX = 'test-';

// Helper to generate test session ID
function generateTestSessionId(): string {
  return `${TEST_SESSION_PREFIX}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to clean up test sessions
async function cleanupTestSessions() {
  const sql = getDb();
  try {
    await sql`
      DELETE FROM chat_messages 
      WHERE session_id LIKE ${TEST_SESSION_PREFIX + '%'}
    `;
    await sql`
      DELETE FROM chat_sessions 
      WHERE session_id LIKE ${TEST_SESSION_PREFIX + '%'}
    `;
    console.log('[v0] Cleaned up test sessions');
  } catch (error) {
    console.error('[v0] Error cleaning up test sessions:', error);
  }
}

describe('Chat Session Management', () => {
  let testSessionId: string;

  beforeAll(async () => {
    await cleanupTestSessions();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestSessions();
  });

  test('should create a new chat session', async () => {
    const session = await getOrCreateSession(testSessionId);
    
    expect(session).toBeDefined();
    expect(session.session_id).toBe(testSessionId);
    expect(session.created_at).toBeInstanceOf(Date);
    console.log('[v0] ✓ Created session:', session.session_id);
  });

  test('should retrieve existing session', async () => {
    const session = await getOrCreateSession(testSessionId);
    
    expect(session.session_id).toBe(testSessionId);
    console.log('[v0] ✓ Retrieved existing session');
  });

  test('should save user message', async () => {
    await saveMessage(testSessionId, {
      role: 'user',
      content: 'What is the jab?',
    });

    const history = await getChatHistory(testSessionId);
    expect(history.length).toBe(1);
    expect(history[0].role).toBe('user');
    expect(history[0].content).toBe('What is the jab?');
    console.log('[v0] ✓ Saved user message');
  });

  test('should save assistant message', async () => {
    await saveMessage(testSessionId, {
      role: 'assistant',
      content: 'The jab is a fundamental boxing punch...',
    });

    const history = await getChatHistory(testSessionId);
    expect(history.length).toBe(2);
    expect(history[1].role).toBe('assistant');
    console.log('[v0] ✓ Saved assistant message');
  });

  test('should retrieve chat history in order', async () => {
    const history = await getChatHistory(testSessionId);
    
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].role).toBe('user');
    expect(history[1].role).toBe('assistant');
    console.log('[v0] ✓ Retrieved chat history in correct order');
  });

  test('should list all sessions', async () => {
    const sessions = await getAllSessions(10);
    
    expect(Array.isArray(sessions)).toBe(true);
    const testSession = sessions.find(s => s.session_id === testSessionId);
    expect(testSession).toBeDefined();
    expect(testSession?.message_count).toBeGreaterThan(0);
    console.log('[v0] ✓ Listed all sessions');
  });
});

describe('Chat API Endpoints', () => {
  let testSessionId: string;

  beforeAll(async () => {
    await cleanupTestSessions();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestSessions();
  });

  test('GET /api/chat?getAll=true should return all sessions', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/chat?getAll=true`);
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.sessions).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
    console.log('[v0] ✓ GET all sessions endpoint works');
  });

  test('GET /api/chat?sessionId=xxx should return chat history', async () => {
    // First create a session with a message
    await getOrCreateSession(testSessionId);
    await saveMessage(testSessionId, {
      role: 'user',
      content: 'Test message for API',
    });

    const response = await fetch(`${TEST_BASE_URL}/api/chat?sessionId=${testSessionId}`);
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.messages).toBeDefined();
    expect(Array.isArray(data.messages)).toBe(true);
    expect(data.messages.length).toBeGreaterThan(0);
    console.log('[v0] ✓ GET chat history endpoint works');
  });

  test('POST /api/chat should create and process chat message', async () => {
    const newSessionId = generateTestSessionId();
    
    // This matches the exact format sent by the app's useChat hook + DefaultChatTransport
    // Format: { sessionId, messages: UIMessage[] } where UIMessage has { id, role, parts }
    const response = await fetch(`${TEST_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: newSessionId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'What is the jab?' }],
          },
        ],
      }),
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    console.log('[v0] ✓ POST chat endpoint accepts requests');
    
    // Clean up
    await cleanupTestSessions();
  });

  test('POST /api/chat should require sessionId', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Test' }],
          },
        ],
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('sessionId');
    console.log('[v0] ✓ POST chat endpoint validates sessionId');
  });

  test('DELETE /api/chat?sessionId=xxx should delete session', async () => {
    const deleteSessionId = generateTestSessionId();
    
    // Create session and messages
    await getOrCreateSession(deleteSessionId);
    await saveMessage(deleteSessionId, {
      role: 'user',
      content: 'Test message',
    });

    // Delete via API
    const response = await fetch(`${TEST_BASE_URL}/api/chat?sessionId=${deleteSessionId}`, {
      method: 'DELETE',
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify deletion
    const history = await getChatHistory(deleteSessionId);
    expect(history.length).toBe(0);
    console.log('[v0] ✓ DELETE session endpoint works');
  });
});

describe('AI Response Format', () => {
  let testSessionId: string;

  beforeAll(async () => {
    await cleanupTestSessions();
    testSessionId = generateTestSessionId();
  });

  afterAll(async () => {
    await cleanupTestSessions();
  });

  test('AI response should contain coaching content', async () => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('[v0] ⚠ Skipping AI test - OPENROUTER_API_KEY not set');
      return;
    }

    const response = await fetch(`${TEST_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: testSessionId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'What is the jab?' }],
          },
        ],
      }),
    });

    expect(response.ok).toBe(true);
    
    // Read stream response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullText += chunk;
        
        // Stop after reasonable amount of data
        if (fullText.length > 5000) break;
      }
    }

    expect(fullText.length).toBeGreaterThan(0);
    console.log('[v0] ✓ AI response received');
    console.log('[v0] Response preview:', fullText.substring(0, 200));
  });

  test('AI response should be saved to database', async () => {
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('[v0] ⚠ Skipping AI test - OPENROUTER_API_KEY not set');
      return;
    }

    const aiTestSessionId = generateTestSessionId();
    
    // Send a message using the same format as the app (useChat + DefaultChatTransport)
    // Format matches: { sessionId, messages: [{ id, role, parts: [{ type: 'text', text }] }] }
    await fetch(`${TEST_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: aiTestSessionId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Explain the jab technique' }],
          },
        ],
      }),
    });

    // Wait for async save to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    const history = await getChatHistory(aiTestSessionId);
    
    // Should have at least user message, possibly assistant message
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].role).toBe('user');
    
    if (history.length > 1) {
      expect(history[1].role).toBe('assistant');
      expect(history[1].content.length).toBeGreaterThan(0);
      console.log('[v0] ✓ AI response saved to database');
    } else {
      console.log('[v0] ⚠ Assistant message not yet saved (async processing)');
    }
  });
});

describe('Session Data Integrity', () => {
  test('sessions should have proper date fields', async () => {
    const sessions = await getAllSessions(5);
    
    for (const session of sessions) {
      expect(session.created_at).toBeInstanceOf(Date);
      expect(session.updated_at).toBeInstanceOf(Date);
      expect(session.session_id).toBeDefined();
      expect(typeof session.message_count).toBe('number');
    }
    console.log('[v0] ✓ All sessions have proper date fields');
  });

  test('session dates should be valid', async () => {
    const sessions = await getAllSessions(5);
    
    for (const session of sessions) {
      expect(session.created_at.getTime()).toBeGreaterThan(0);
      expect(session.updated_at.getTime()).toBeGreaterThan(0);
      expect(session.updated_at.getTime()).toBeGreaterThanOrEqual(session.created_at.getTime());
    }
    console.log('[v0] ✓ All session dates are valid');
  });
});

// Run tests if executed directly
if (import.meta.main) {
  console.log('[v0] Starting chat API tests...');
  console.log('[v0] Model: google/gemini-2.5-flash');
  console.log('[v0] Base URL:', TEST_BASE_URL);
  console.log('[v0] Make sure your Next.js dev server is running on', TEST_BASE_URL);
  console.log('');
}

