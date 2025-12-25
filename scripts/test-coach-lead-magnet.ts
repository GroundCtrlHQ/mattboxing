/**
 * Test script for the Coach Lead Magnet API endpoint
 * Simulates the form submission from the /coach page
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function checkServerRunning() {
  try {
    const response = await fetch(`${API_URL}/api/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function testCoachLeadMagnet() {
  console.log('🧪 Testing Coach Lead Magnet API...\n');
  console.log(`🌐 API URL: ${API_URL}\n`);

  // Check if server is running
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('⚠️  Server might not be running. Make sure to start it with: bun dev\n');
    console.log('   Continuing anyway...\n');
  } else {
    console.log('✅ Server appears to be running\n');
  }

  // Simulate form data from the simplified coaching form
  const formData = {
    experience: 'Beginner',
    stance: 'Orthodox',
    location: 'Gym',
    timeAvailable: '30min',
  };

  console.log('📝 Form Data:');
  console.log(JSON.stringify(formData, null, 2));
  console.log('\n');

  // Build the prompt as the form does
  const prompt = `I'm a ${formData.experience} boxer with an ${formData.stance} stance. I train at ${formData.location} and have ${formData.timeAvailable} available. Please provide personalised coaching based on my needs.`;

  const requestBody = {
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    context: {
      formData: {
        location: formData.location,
        timeAvailable: formData.timeAvailable,
        experience: formData.experience,
        stance: formData.stance,
      },
      userProfile: {
        stance: formData.stance,
        experience: formData.experience,
      },
    },
    isLeadMagnet: true, // CRITICAL: Use lead magnet prompt and logic
  };

  console.log('📤 Sending request to /api/coach...\n');
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  console.log('\n');

  try {
    const response = await fetch(`${API_URL}/api/coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      console.error('❌ Error response:', response.status, response.statusText);
      console.error('Error body:', errorText);
      console.error('\n💡 Make sure:');
      console.error('   1. The server is running (bun dev)');
      console.error('   2. OPENROUTER_API_KEY is set in .env.local');
      console.error('   3. The database is set up correctly');
      return;
    }

    console.log('✅ Response received (streaming)...\n');
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('\n');

    // Check if it's a stream
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      console.log('⚠️  Response is not a stream, trying to parse as JSON...');
      const jsonData = await response.json();
      console.log('Response:', JSON.stringify(jsonData, null, 2));
      return;
    }

    // Stream the response
    const reader = response.body?.getReader();

    if (!reader) {
      console.error('❌ No response body reader available');
      console.error('Response body:', response.body);
      return;
    }

    const decoder = new TextDecoder();

    let fullResponse = '';
    let buffer = '';
    let foundVideos: any[] = [];

    console.log('📥 Streaming response...\n');
    console.log('--- Response Stream ---\n');

    let chunkCount = 0;
    const startTime = Date.now();
    const timeout = 120000; // 120 second timeout (tool calls + structured output can take time)
    let lastChunkTime = Date.now();
    const chunkTimeout = 15000; // If no chunks for 15 seconds, consider done
    let hasStructuredOutput = false;

    while (true) {
      // Check for timeout
      if (Date.now() - startTime > timeout) {
        console.log(`\n[Timeout after ${timeout}ms]`);
        break;
      }

      // Check if we've been waiting too long for next chunk
      if (chunkCount > 0 && Date.now() - lastChunkTime > chunkTimeout) {
        console.log(`\n[No chunks for ${chunkTimeout}ms, considering stream complete]`);
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        // If we finished with tool-calls, wait a bit to see if there's more
        if (chunkCount > 0 && !hasStructuredOutput) {
          console.log(`\n[Stream ended after ${chunkCount} chunks, ${Date.now() - startTime}ms]`);
          console.log('[Waiting 3 seconds to see if connection continues...]');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try reading one more time
          try {
            const { done: retryDone, value: retryValue } = await reader.read();
            if (!retryDone && retryValue) {
              console.log('[Received additional data after wait!]');
              chunkCount++;
              buffer += decoder.decode(retryValue, { stream: true });
              // Process this chunk
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data !== '[DONE]' && data) {
                    try {
                      const parsed = JSON.parse(data);
                      if (parsed.type === 'object' || parsed.type === 'object-delta' || parsed.type === 'text-delta') {
                        console.log(`\n[🎯 Found continuation data]:`, JSON.stringify(parsed, null, 2).substring(0, 800));
                      }
                    } catch (e) {
                      // Skip
                    }
                  }
                }
              }
            }
          } catch (e) {
            // Stream is truly done
          }
        } else {
          console.log(`\n[Stream ended after ${chunkCount} chunks, ${Date.now() - startTime}ms]`);
        }
        break;
      }

      lastChunkTime = Date.now();

      chunkCount++;
      if (chunkCount <= 5 || chunkCount % 10 === 0) {
        console.log(`\n[Chunk ${chunkCount}, ${value.length} bytes, ${Date.now() - startTime}ms elapsed]`);
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Handle SSE format
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            console.log('\n[Received [DONE] marker]');
            continue;
          }

            try {
              const parsed = JSON.parse(data);

              // Log ALL chunks for structured output detection
              if (parsed.type === 'object' || parsed.type === 'object-delta' || parsed.type === 'text-delta' || parsed.type === 'text') {
                console.log(`\n[🎯 IMPORTANT - Chunk ${chunkCount}]:`, JSON.stringify(parsed, null, 2).substring(0, 800));
              } else if (chunkCount <= 10) {
                console.log(`\n[Chunk ${chunkCount} data structure]:`, JSON.stringify(parsed, null, 2).substring(0, 500));
              }

              // Check for tool videos
              if (parsed.tool_videos && Array.isArray(parsed.tool_videos)) {
                foundVideos = [...foundVideos, ...parsed.tool_videos];
                console.log(`\n[Found ${parsed.tool_videos.length} video(s) from tool call]`);
              }

            // Handle AI SDK format (toUIMessageStreamResponse)
            let content = '';
            
            // Check for structured output (object type)
            if (parsed.type === 'object' && parsed.object) {
              hasStructuredOutput = true;
              console.log('\n✅ [STRUCTURED OUTPUT RECEIVED!]');
              console.log(JSON.stringify(parsed.object, null, 2));
              fullResponse = JSON.stringify(parsed.object, null, 2);
              process.stdout.write('\n\n🎉 [STRUCTURED OUTPUT]\n' + fullResponse + '\n');
            }
            // Check for object delta (partial structured output)
            else if (parsed.type === 'object-delta' && parsed.objectDelta) {
              hasStructuredOutput = true;
              console.log('\n[📦 Partial structured output delta]');
              console.log(JSON.stringify(parsed.objectDelta, null, 2).substring(0, 500));
              // Accumulate partial object
              if (!fullResponse || !fullResponse.startsWith('{')) {
                fullResponse = '{}';
              }
              try {
                const current = JSON.parse(fullResponse);
                const merged = { ...current, ...parsed.objectDelta };
                fullResponse = JSON.stringify(merged, null, 2);
              } catch (e) {
                // If parsing fails, just use the delta
                fullResponse = JSON.stringify(parsed.objectDelta, null, 2);
              }
            }
            // Text content
            else if (parsed.type === 'text-delta' && parsed.textDelta) {
              content = parsed.textDelta;
            } else if (parsed.type === 'text' && parsed.text) {
              content = parsed.text;
            } 
            // OpenRouter format (fallback)
            else if (parsed.choices?.[0]?.delta?.content) {
              content = parsed.choices[0].delta.content;
            } else if (parsed.choices?.[0]?.message?.content) {
              content = parsed.choices[0].message.content;
            } 
            // Generic formats
            else if (parsed.text) {
              content = parsed.text;
            } else if (parsed.content) {
              content = parsed.content;
            }
            // Check for full message content
            else if (parsed.choices?.[0]?.message) {
              const msg = parsed.choices[0].message;
              if (typeof msg === 'string') {
                content = msg;
              } else if (msg.content) {
                content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
              }
            }

            if (content) {
              fullResponse += content;
              process.stdout.write(content);
            }

              // Log tool calls for debugging
              if (parsed.type === 'tool-call' || parsed.type === 'tool-result') {
                console.log(`\n[AI SDK tool event: ${parsed.type}]`);
              }
              if (parsed.choices?.[0]?.delta?.tool_calls) {
                console.log(`\n[Tool call detected in delta]`);
              }

              // Log errors
              if (parsed.error) {
                console.log(`\n[ERROR in stream]:`, JSON.stringify(parsed.error, null, 2));
              }
            } catch (e: any) {
            // Log raw line for debugging (first few chunks)
            if (chunkCount <= 5) {
              console.log(`\n[Parse error on line (chunk ${chunkCount}):`, e.message);
              console.log(`  Line preview:`, line.substring(0, 200));
            }
          }
        } 
        // Handle non-SSE lines (might be plain text or other format)
        else if (line.trim() && !line.startsWith(':')) {
          if (chunkCount <= 5) {
            console.log(`\n[Non-SSE line (chunk ${chunkCount}):`, line.substring(0, 150));
          }
          // Try to add to response if it looks like content
          if (line.trim().length > 10 && !line.includes('OPENROUTER')) {
            fullResponse += line + '\n';
          }
        }
      }
    }

    console.log(`\n[Total chunks: ${chunkCount}, Total time: ${Date.now() - startTime}ms]`);
    
    // Final check for structured output
    if (hasStructuredOutput) {
      console.log('\n✅ Successfully received structured output!');
      if (fullResponse) {
        try {
          const parsed = JSON.parse(fullResponse);
          console.log('\n📋 Final parsed structured output:');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('\n⚠️  Response looks like JSON but failed to parse:', e.message);
        }
      }
    } else if (fullResponse.includes('"finishReason":"tool-calls"') || fullResponse.includes('finishReason: "tool-calls"')) {
      console.log('\n⚠️  Stream finished with tool-calls but no structured output received');
      console.log('   The AI SDK should continue automatically with maxSteps: 5');
      console.log('   This might be a timing issue - the useChat hook in browser should handle continuation');
    } else if (fullResponse && fullResponse.length > 0) {
      console.log('\n📝 Received text response (not structured):');
      console.log(fullResponse.substring(0, 500));
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer.trim());
        const content =
          parsed.choices?.[0]?.delta?.content ||
          parsed.choices?.[0]?.message?.content ||
          parsed.text ||
          parsed.content ||
          '';
        if (content) {
          fullResponse += content;
        }
      } catch {
        // Buffer might not be complete JSON
      }
    }

    console.log('\n\n--- End of Stream ---\n');
    console.log('\n📊 Full Response Length:', fullResponse.length, 'characters\n');

    // Try to parse JSON from the response
    console.log('🔍 Attempting to parse JSON from response...\n');

    let jsonResponse = null;
    const trimmedResponse = fullResponse.trim();

    if (trimmedResponse.includes('{') && trimmedResponse.includes('}')) {
      let jsonString = trimmedResponse;

      // Check if it's wrapped in markdown code blocks
      const codeBlockMatch = trimmedResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        // Try to find JSON object directly
        const jsonMatches = trimmedResponse.match(/\{[\s\S]*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          jsonString = jsonMatches[jsonMatches.length - 1];
        }
      }

      try {
        jsonResponse = JSON.parse(jsonString);
        console.log('✅ Successfully parsed JSON response!\n');
        console.log('📋 Parsed Response Structure:');
        console.log(JSON.stringify(jsonResponse, null, 2));
        console.log('\n');

        if (jsonResponse.response) {
          console.log('📝 Main Response Text:');
          console.log('─'.repeat(60));
          console.log(jsonResponse.response);
          console.log('─'.repeat(60));
          console.log('\n');
        }

        if (jsonResponse.suggested_actions && jsonResponse.suggested_actions.length > 0) {
          console.log('🎯 Suggested Actions:', jsonResponse.suggested_actions.length);
          jsonResponse.suggested_actions.forEach((action: any, idx: number) => {
            console.log(`  ${idx + 1}. ${action.label} (${action.action})`);
            if (action.video_id) {
              console.log(`     Video ID: ${action.video_id}`);
            }
          });
          console.log('\n');
        }

        if (jsonResponse.video_recommendations && jsonResponse.video_recommendations.length > 0) {
          console.log('🎥 Video Recommendations:', jsonResponse.video_recommendations.length);
          jsonResponse.video_recommendations.forEach((video: any, idx: number) => {
            console.log(`  ${idx + 1}. ${video.title}`);
            console.log(`     Video ID: ${video.video_id}`);
            if (video.reason) {
              console.log(`     Reason: ${video.reason}`);
            }
          });
          console.log('\n');
        }
      } catch (e) {
        console.log('⚠️  Could not parse as JSON, showing raw response:');
        console.log('─'.repeat(60));
        console.log(trimmedResponse);
        console.log('─'.repeat(60));
        console.log('\n');
        console.log('Parse error:', e);
      }
    } else {
      console.log('⚠️  Response does not appear to contain JSON');
      console.log('Raw response:');
      console.log('─'.repeat(60));
      console.log(trimmedResponse);
      console.log('─'.repeat(60));
    }

    // Show videos from tool calls if any
    if (foundVideos.length > 0) {
      console.log('🎬 Videos from tool calls:', foundVideos.length);
      foundVideos.forEach((video, idx) => {
        console.log(`  ${idx + 1}. ${video.title || video.video_id}`);
        if (video.video_id) {
          console.log(`     Video ID: ${video.video_id}`);
        }
      });
      console.log('\n');
    }

    console.log('✅ Test completed!\n');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testCoachLeadMagnet();

