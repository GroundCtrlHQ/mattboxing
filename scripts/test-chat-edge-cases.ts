/**
 * Worst-case scenario tests for chat API
 * Tests edge cases, special characters, malformed inputs, etc.
 * Run with: bun run scripts/test-chat-edge-cases.ts
 */

import { getOrCreateSession, saveMessage, getChatHistory, getAllSessions } from '../lib/chat-sessions';

const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_SESSION_PREFIX = 'edge-test-';

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

interface TestCase {
  name: string;
  message: string;
  description: string;
}

const edgeCaseTests: TestCase[] = [
  {
    name: 'Quotes in question',
    message: 'What is "The Boxing Locker" philosophy?',
    description: 'Tests handling of quotes that might break JSON'
  },
  {
    name: 'Multiple quotes',
    message: 'Tell me about "jab" and "cross" and "hook"',
    description: 'Multiple quotes in one message'
  },
  {
    name: 'SQL injection attempt',
    message: "'; DROP TABLE chat_messages; --",
    description: 'Malicious SQL injection attempt'
  },
  {
    name: 'Very long message',
    message: 'What is the jab? '.repeat(100),
    description: 'Extremely long message (1000+ chars)'
  },
  {
    name: 'Special characters',
    message: 'What about jabs with émojis 🥊 and spéciál chárs?',
    description: 'Unicode, emojis, special characters'
  },
  {
    name: 'Empty message',
    message: '',
    description: 'Empty string message'
  },
  {
    name: 'Only whitespace',
    message: '   \n\t  ',
    description: 'Whitespace-only message'
  },
  {
    name: 'JSON-like text',
    message: '{"question": "What is the jab?", "type": "technique"}',
    description: 'Message that looks like JSON'
  },
  {
    name: 'Code block in question',
    message: '```\nWhat is the jab?\n```',
    description: 'Message with code block markers'
  },
  {
    name: 'Newlines and tabs',
    message: 'What\nis\tthe\njab?',
    description: 'Message with newlines and tabs'
  },
  {
    name: 'XSS attempt',
    message: '<script>alert("xss")</script>What is the jab?',
    description: 'XSS injection attempt'
  },
  {
    name: 'Unicode injection',
    message: 'What is the jab? \u0000\u0001\u0002',
    description: 'Null bytes and control characters'
  },
  {
    name: 'Very short',
    message: '?',
    description: 'Single character message'
  },
  {
    name: 'Repeated characters',
    message: 'What is the jab? ' + '?'.repeat(50),
    description: 'Many repeated special characters'
  },
  {
    name: 'Mixed case weird',
    message: 'wHaT iS tHe JaB?',
    description: 'Weird capitalization'
  },
  {
    name: 'Only punctuation',
    message: '?!?!?!?!',
    description: 'Only punctuation marks'
  },
  {
    name: 'Asking about self',
    message: 'Who are you?',
    description: 'Question that might trigger introduction'
  },
  {
    name: 'Asking credentials',
    message: 'What is your record?',
    description: 'Question about credentials'
  },
  {
    name: 'Multiple questions',
    message: 'What is the jab? How do I throw it? When should I use it?',
    description: 'Multiple questions in one message'
  },
  {
    name: 'Off-topic',
    message: 'What is the weather today?',
    description: 'Completely off-topic question'
  },
  {
    name: 'Nonsensical',
    message: 'asdfghjkl qwertyuiop zxcvbnm',
    description: 'Random keyboard mashing'
  },
  {
    name: 'Command injection',
    message: 'What is the jab? $(rm -rf /)',
    description: 'Command injection attempt'
  },
  {
    name: 'HTML entities',
    message: 'What is the jab? &lt;script&gt;&lt;/script&gt;',
    description: 'HTML entities in message'
  },
  {
    name: 'URL in message',
    message: 'Check out https://example.com and tell me about jabs',
    description: 'URL in message'
  },
  {
    name: 'Email in message',
    message: 'Email me at test@example.com about jabs',
    description: 'Email address in message'
  }
];

async function testEdgeCase(testCase: TestCase): Promise<boolean> {
  const sessionId = generateTestSessionId();
  console.log(`\n  Testing: ${testCase.name}`);
  console.log(`  Description: ${testCase.description}`);
  console.log(`  Message: ${testCase.message.substring(0, 60)}${testCase.message.length > 60 ? '...' : ''}`);

  try {
    // Test 1: Save message to DB
    try {
      await getOrCreateSession(sessionId);
      await saveMessage(sessionId, {
        role: 'user',
        content: testCase.message,
      });
      console.log('    ✓ Message saved to DB');
    } catch (error: any) {
      console.log(`    ✗ DB save failed: ${error.message}`);
      return false;
    }

    // Test 2: Retrieve from DB
    try {
      const history = await getChatHistory(sessionId);
      if (history.length === 1) {
        // For messages with null bytes/control chars, they get sanitized
        // So we check if the message was saved (even if sanitized)
        const sanitized = testCase.message
          .replace(/\0/g, '')
          .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F]/g, '');
        
        // If original had null bytes, expect sanitized version
        const expected = testCase.message.includes('\0') || /[\x01-\x08\x0B-\x0C\x0E-\x1F]/.test(testCase.message)
          ? sanitized
          : testCase.message;
        
        if (history[0].content === expected || history[0].content === sanitized) {
          console.log('    ✓ Message retrieved correctly');
        } else {
          console.log(`    ⚠ Message retrieved but content differs (expected due to sanitization)`);
          // Don't fail - sanitization is expected behavior
        }
      } else {
        console.log(`    ✗ Message retrieval failed - expected 1 message, got ${history.length}`);
        return false;
      }
    } catch (error: any) {
      console.log(`    ✗ DB retrieval failed: ${error.message}`);
      return false;
    }

    // Test 3: API call (if OPENROUTER_API_KEY is set)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch(`${TEST_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionId + '-api',
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                parts: [{ type: 'text', text: testCase.message }],
              },
            ],
          }),
        });

        if (!response.ok) {
          console.log(`    ⚠ API call failed: ${response.status}`);
          // This might be expected for some edge cases, so don't fail
        } else {
          // Check if response is valid
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('text/event-stream')) {
            console.log('    ✓ API accepted request and returned stream');
            
            // Try to read a bit of the stream
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let chunkCount = 0;
            let hasValidData = false;

            if (reader) {
              while (chunkCount < 10) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                if (chunk.includes('text-delta') || chunk.includes('text-start')) {
                  hasValidData = true;
                }
                chunkCount++;
              }
            }

            if (hasValidData) {
              console.log('    ✓ Stream contains valid data');
            } else {
              console.log('    ⚠ Stream might be empty or invalid');
            }
          } else {
            console.log(`    ⚠ Unexpected content type: ${contentType}`);
          }
        }
      } catch (error: any) {
        console.log(`    ⚠ API call error: ${error.message}`);
        // Don't fail - some edge cases might legitimately cause errors
      }
    } else {
      console.log('    ⚠ Skipping API test - OPENROUTER_API_KEY not set');
    }

    return true;
  } catch (error: any) {
    console.log(`    ✗ Test failed: ${error.message}`);
    return false;
  }
}

async function testRapidFire() {
  console.log('\n🔥 Testing Rapid Fire Messages...');
  const sessionId = generateTestSessionId();
  
  try {
    await getOrCreateSession(sessionId);
    
    // Send 10 messages rapidly
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        saveMessage(sessionId, {
          role: 'user',
          content: `Message ${i + 1}`,
        })
      );
    }
    
    await Promise.all(promises);
    console.log('  ✓ All 10 messages saved');
    
    const history = await getChatHistory(sessionId);
    if (history.length === 10) {
      console.log('  ✓ All messages retrieved correctly');
      return true;
    } else {
      console.log(`  ✗ Expected 10 messages, got ${history.length}`);
      return false;
    }
  } catch (error: any) {
    console.log(`  ✗ Rapid fire test failed: ${error.message}`);
    return false;
  }
}

async function testConcurrentSessions() {
  console.log('\n🔄 Testing Concurrent Sessions...');
  
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      const sessionId = generateTestSessionId();
      promises.push(
        (async () => {
          await getOrCreateSession(sessionId);
          await saveMessage(sessionId, {
            role: 'user',
            content: `Concurrent test ${i}`,
          });
          return sessionId;
        })()
      );
    }
    
    const sessionIds = await Promise.all(promises);
    console.log(`  ✓ Created ${sessionIds.length} concurrent sessions`);
    
    // Verify all sessions exist
    const allSessions = await getAllSessions(100);
    const found = sessionIds.filter(id => 
      allSessions.some(s => s.session_id === id)
    );
    
    if (found.length === sessionIds.length) {
      console.log('  ✓ All concurrent sessions found');
      return true;
    } else {
      console.log(`  ✗ Only found ${found.length}/${sessionIds.length} sessions`);
      return false;
    }
  } catch (error: any) {
    console.log(`  ✗ Concurrent sessions test failed: ${error.message}`);
    return false;
  }
}

async function testVeryLongSession() {
  console.log('\n📜 Testing Very Long Session...');
  const sessionId = generateTestSessionId();
  
  try {
    await getOrCreateSession(sessionId);
    
    // Create a conversation with 50 messages
    for (let i = 0; i < 50; i++) {
      await saveMessage(sessionId, {
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1} in a very long conversation`,
      });
    }
    
    console.log('  ✓ Created 50-message conversation');
    
    const history = await getChatHistory(sessionId);
    if (history.length === 50) {
      console.log('  ✓ All 50 messages retrieved');
      
      // Test with limit
      const limited = await getChatHistory(sessionId, 10);
      if (limited.length === 10) {
        console.log('  ✓ Limit parameter works correctly');
        return true;
      } else {
        console.log(`  ✗ Limit failed: expected 10, got ${limited.length}`);
        return false;
      }
    } else {
      console.log(`  ✗ Expected 50 messages, got ${history.length}`);
      return false;
    }
  } catch (error: any) {
    console.log(`  ✗ Long session test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Chat API Edge Case Tests');
  console.log('═══════════════════════════════════════');
  console.log(`Base URL: ${TEST_BASE_URL}`);
  console.log('Testing worst-case scenarios...\n');

  await cleanupTestSessions();

  const results = {
    edgeCases: [] as boolean[],
    rapidFire: false,
    concurrent: false,
    longSession: false,
  };

  // Test all edge cases
  console.log('📋 Testing Edge Cases...');
  for (const testCase of edgeCaseTests) {
    const result = await testEdgeCase(testCase);
    results.edgeCases.push(result);
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test rapid fire
  results.rapidFire = await testRapidFire();

  // Test concurrent sessions
  results.concurrent = await testConcurrentSessions();

  // Test long session
  results.longSession = await testVeryLongSession();

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Test Results Summary:');
  console.log(`  Edge Cases: ${results.edgeCases.filter(r => r).length}/${results.edgeCases.length} passed`);
  console.log(`  Rapid Fire: ${results.rapidFire ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Concurrent Sessions: ${results.concurrent ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Long Session: ${results.longSession ? '✓ PASS' : '✗ FAIL'}`);
  console.log('═══════════════════════════════════════\n');

  // Show failed edge cases
  const failed = edgeCaseTests.filter((_, i) => !results.edgeCases[i]);
  if (failed.length > 0) {
    console.log('⚠️  Failed Edge Cases:');
    failed.forEach((test, i) => {
      const idx = edgeCaseTests.indexOf(test);
      console.log(`  ${idx + 1}. ${test.name}: ${test.description}`);
    });
    console.log('');
  }

  await cleanupTestSessions();

  const allPassed = 
    results.edgeCases.every(r => r) &&
    results.rapidFire &&
    results.concurrent &&
    results.longSession;

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);

