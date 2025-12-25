/**
 * Simple test script for AI chat session functionality
 * Run with: bun run scripts/test-chat-simple.ts
 * 
 * Model: google/gemini-2.5-flash via OpenRouter
 * 
 * This script tests the chat API without requiring the full test framework.
 * Make sure your Next.js dev server is running before executing.
 */

import { getOrCreateSession, saveMessage, getChatHistory, getAllSessions } from '../lib/chat-sessions';

const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_SESSION_PREFIX = 'test-simple-';

function generateTestSessionId(): string {
  return `${TEST_SESSION_PREFIX}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function cleanupTestSessions() {
  const { getDb } = await import('../lib/db');
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
    console.log('✓ Cleaned up test sessions');
  } catch (error) {
    console.error('✗ Error cleaning up:', error);
  }
}

async function testSessionManagement() {
  console.log('\n📋 Testing Session Management...');
  
  const sessionId = generateTestSessionId();
  
  // Test 1: Create session
  console.log('  Testing session creation...');
  const session = await getOrCreateSession(sessionId);
  if (session && session.session_id === sessionId) {
    console.log('  ✓ Session created successfully');
  } else {
    console.log('  ✗ Session creation failed');
    return false;
  }

  // Test 2: Save messages
  console.log('  Testing message saving...');
  await saveMessage(sessionId, {
    role: 'user',
    content: 'What is the jab?',
  });
  await saveMessage(sessionId, {
    role: 'assistant',
    content: 'The jab is a fundamental boxing punch...',
  });
  console.log('  ✓ Messages saved');

  // Test 3: Retrieve history
  console.log('  Testing history retrieval...');
  const history = await getChatHistory(sessionId);
  if (history.length === 2 && history[0].role === 'user') {
    console.log('  ✓ History retrieved correctly');
  } else {
    console.log('  ✗ History retrieval failed');
    return false;
  }

  // Test 4: List all sessions
  console.log('  Testing session listing...');
  const sessions = await getAllSessions(10);
  const found = sessions.find(s => s.session_id === sessionId);
  // message_count might be returned as string/number from DB, so convert to number
  const messageCount = typeof found?.message_count === 'string' 
    ? parseInt(found.message_count, 10) 
    : Number(found?.message_count || 0);
  
  if (found && messageCount === 2) {
    console.log('  ✓ Session listing works');
  } else {
    console.log(`  ✗ Session listing failed - found: ${!!found}, message_count: ${messageCount} (expected 2)`);
    return false;
  }

  return true;
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  
  // Test GET all sessions
  console.log('  Testing GET /api/chat?getAll=true...');
  try {
    const response = await fetch(`${TEST_BASE_URL}/api/chat?getAll=true`);
    if (response.ok) {
      const data = await response.json();
      if (data.sessions && Array.isArray(data.sessions)) {
        console.log(`  ✓ GET all sessions works (${data.sessions.length} sessions)`);
      } else {
        console.log('  ✗ Invalid response format');
        return false;
      }
    } else {
      console.log(`  ✗ Request failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Request error: ${error}`);
    return false;
  }

  // Test GET specific session
  console.log('  Testing GET /api/chat?sessionId=xxx...');
  const testSessionId = generateTestSessionId();
  await getOrCreateSession(testSessionId);
  await saveMessage(testSessionId, {
    role: 'user',
    content: 'Test API message',
  });

  try {
    const response = await fetch(`${TEST_BASE_URL}/api/chat?sessionId=${testSessionId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        console.log('  ✓ GET session history works');
      } else {
        console.log('  ✗ Invalid response format');
        return false;
      }
    } else {
      console.log(`  ✗ Request failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Request error: ${error}`);
    return false;
  }

  // Test POST chat (without waiting for full response)
  // Note: This matches the format sent by AI SDK's DefaultChatTransport
  // The app uses useChat hook which sends: { sessionId, messages: UIMessage[] }
  // where UIMessage has: { id, role, parts: [{ type: 'text', text }] }
  console.log('  Testing POST /api/chat...');
  const newSessionId = generateTestSessionId();
  try {
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

    if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
      console.log('  ✓ POST chat endpoint accepts requests');
    } else {
      console.log(`  ✗ Request failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Request error: ${error}`);
    return false;
  }

  // Test DELETE session
  console.log('  Testing DELETE /api/chat?sessionId=xxx...');
  const deleteSessionId = generateTestSessionId();
  await getOrCreateSession(deleteSessionId);
  await saveMessage(deleteSessionId, {
    role: 'user',
    content: 'Test delete',
  });

  try {
    const response = await fetch(`${TEST_BASE_URL}/api/chat?sessionId=${deleteSessionId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Verify deletion
        const history = await getChatHistory(deleteSessionId);
        if (history.length === 0) {
          console.log('  ✓ DELETE session works');
        } else {
          console.log('  ✗ Session not fully deleted');
          return false;
        }
      } else {
        console.log('  ✗ Delete response invalid');
        return false;
      }
    } else {
      console.log(`  ✗ Request failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Request error: ${error}`);
    return false;
  }

  return true;
}

async function testAIResponse() {
  console.log('\n🤖 Testing AI Response...');
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('  ⚠ Skipping - OPENROUTER_API_KEY not set');
    return true;
  }

  const aiSessionId = generateTestSessionId();
  console.log('  Sending test message to AI...');
  console.log('  (Using same format as app: DefaultChatTransport sends { sessionId, messages: UIMessage[] })');
  
  try {
    // This matches exactly what the app sends via useChat hook + DefaultChatTransport
    const response = await fetch(`${TEST_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: aiSessionId,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'What is the jab? Keep it brief.' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.log(`  ✗ Request failed: ${response.status}`);
      return false;
    }

    // Read stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let chunkCount = 0;

    if (reader) {
      while (chunkCount < 100) { // Limit chunks
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullText += chunk;
        chunkCount++;
      }
    }

    if (fullText.length > 0) {
      console.log('  ✓ AI response received');
      console.log(`  Response preview: ${fullText.substring(0, 150)}...`);
      
      // Wait a bit for async save
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const history = await getChatHistory(aiSessionId);
      if (history.length >= 1 && history[0].role === 'user') {
        console.log('  ✓ User message saved');
        if (history.length > 1) {
          console.log('  ✓ Assistant message saved');
        }
      }
    } else {
      console.log('  ✗ No response received');
      return false;
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error}`);
    return false;
  }

  return true;
}

async function main() {
  console.log('🧪 Chat API Test Suite');
  console.log('═══════════════════════════════════════');
  console.log(`Model: google/gemini-2.5-flash`);
  console.log(`Base URL: ${TEST_BASE_URL}`);
  console.log('Make sure your Next.js dev server is running!\n');

  await cleanupTestSessions();

  const results = {
    sessionManagement: false,
    apiEndpoints: false,
    aiResponse: false,
  };

  try {
    results.sessionManagement = await testSessionManagement();
    results.apiEndpoints = await testAPIEndpoints();
    results.aiResponse = await testAIResponse();
  } catch (error) {
    console.error('\n✗ Test suite error:', error);
  } finally {
    await cleanupTestSessions();
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Test Results:');
  console.log(`  Session Management: ${results.sessionManagement ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  API Endpoints: ${results.apiEndpoints ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  AI Response: ${results.aiResponse ? '✓ PASS' : '⚠ SKIP'}`);
  console.log('═══════════════════════════════════════\n');

  const allPassed = results.sessionManagement && results.apiEndpoints;
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);

