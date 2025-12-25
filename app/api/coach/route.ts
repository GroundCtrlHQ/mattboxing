import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { z } from 'zod';
import { createLeadMagnetPrompt, type CoachingContext } from '@/lib/openrouter';
import { searchVideos } from '@/lib/video-search';

export const runtime = 'nodejs';
export const maxDuration = 60; // Increased for tool calls

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// System prompt for lead magnet coaching (structured JSON output)
const leadMagnetSystemPrompt = `You are Matt Goddard, "The Boxing Locker" - a 7-0 professional boxer and National Champion. You provide comprehensive, actionable coaching for beginners in a direct, motivational style.

RESPONSE FORMAT:
Provide a complete, actionable coaching response that covers technique, drills, and mindset. Then ALWAYS end with a JSON block:

\`\`\`json
{
  "response": "Complete coaching response text here",
  "video_recommendations": [
    {"video_id": "video_id_here", "title": "Video Title", "reason": "Why this video helps"}
  ]
}
\`\`\`

JSON RULES:
- Always generate valid JSON
- video_recommendations: 1-3 videos based on coaching context
- CRITICAL: Only use video_id values that were returned by the search_video_library tool - check the tool output and use those exact video_id values
- Do NOT invent or make up video IDs - only use IDs from the tool results
- If no videos were found by the tool, omit video_recommendations entirely

Provide comprehensive, fundamentals-focused coaching that beginners can immediately apply. This is a lead magnet - focus on delivering value, not follow-up actions.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, isLeadMagnet } = body as {
      messages?: Array<{ role: string; parts?: Array<{ type: string; text?: string }>; content?: string }>;
      context?: CoachingContext;
      isLeadMagnet?: boolean;
    };

    // Handle both useChat format (with parts) and direct format (with content)
    let modelMessages;
    if (messages && messages.length > 0) {
      // Convert to simple CoreMessage format for streamText
      modelMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content || (msg.parts?.find(p => p.type === 'text')?.text) || '',
      }));
    } else {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // For lead magnet, use the structured JSON prompt instead of Output.object()
    const systemPrompt = isLeadMagnet
      ? leadMagnetSystemPrompt
      : createLeadMagnetPrompt(context); // Fallback

    // Stream response with tool support (like chat API)
    const result = streamText({
      model: openrouter('google/gemini-2.5-flash'),
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        search_video_library: {
          description: 'Search the video library for relevant boxing technique videos. Use this when the user asks about specific techniques, wants to see demonstrations, or needs video recommendations.',
          inputSchema: z.object({
            category: z.enum(['Technique', 'Tactics', 'Training', 'Mindset']).optional().describe('The main category of boxing content'),
            subtopic: z.string().optional().describe('Specific technique or topic (e.g., "Jab", "Footwork", "Combination", "Distance")'),
            tags: z.array(z.string()).optional().describe('Relevant tags to search for (e.g., ["orthodox", "power", "speed"])'),
            limit: z.number().optional().describe('Maximum number of videos to return'),
          }),
          execute: async (args) => {
            try {
              const videos = await searchVideos({
                category: args.category as 'Technique' | 'Tactics' | 'Training' | 'Mindset' | undefined,
                subtopic: args.subtopic,
                tags: args.tags,
                limit: args.limit || 3,
              });

              // Log video IDs for debugging
              console.log('[Coach API] Found videos:', videos.map(v => ({ id: v.video_id, title: v.video_title })));

              return {
                type: 'video_selections' as const,
                videos: videos.map(v => ({
                  video_id: v.video_id,
                  title: v.video_title,
                  topic: v.topic,
                  subtopic: v.subtopic,
                  reason: `Relevant video for ${args.subtopic || args.category || 'boxing technique'}`,
                })),
              };
            } catch (error: any) {
              console.error('[Coach API] Video search error:', error);
              return {
                type: 'video_selections' as const,
                videos: [] as { video_id: string; title: string; topic: string; subtopic: string | null; reason: string }[],
                error: error.message,
              };
            }
          },
        },
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[Coach API] Error:', error);
    const errorMessage = error.message || 'Failed to get coaching response';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
