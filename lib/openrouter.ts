/**
 * OpenRouter API client for AI coaching with tool calling and structured output
 * Uses anthropic/claude-3-5-sonnet model
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface CoachingContext {
  category: 'Technique' | 'Tactics' | 'Training' | 'Mindset';
  formData: Record<string, any>;
  userProfile?: {
    stance?: 'Orthodox' | 'Southpaw' | 'Switch';
    experience?: 'Beginner' | 'Intermediate' | 'Pro';
    name?: string;
  };
}

/**
 * Structured output schema for button choices
 */
export const buttonChoicesSchema = {
  type: 'object',
  properties: {
    response: {
      type: 'string',
      description: 'The main coaching response text',
    },
    suggested_actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
            description: 'Button label text',
          },
          action: {
            type: 'string',
            description: 'Action type: "ask_question" | "watch_video" | "explore_topic"',
          },
          value: {
            type: 'string',
            description: 'The value/query for this action',
          },
          video_id: {
            type: 'string',
            description: 'YouTube video ID if action is "watch_video"',
          },
        },
        required: ['label', 'action', 'value'],
      },
      description: 'Suggested follow-up actions as buttons',
    },
    video_recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          video_id: { type: 'string' },
          title: { type: 'string' },
          reason: { type: 'string' },
        },
      },
      description: 'Recommended videos to watch',
    },
  },
  required: ['response'],
};

/**
 * Tool definitions for video library search
 */
export const videoSearchTools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_video_library',
      description: 'Search the video library for relevant boxing technique videos. Use this when the user asks about specific techniques, wants to see demonstrations, or needs video recommendations.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['Technique', 'Tactics', 'Training', 'Mindset'],
            description: 'The main category of boxing content',
          },
          subtopic: {
            type: 'string',
            description: 'Specific technique or topic (e.g., "Jab", "Footwork", "Combination", "Distance")',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Relevant tags to search for (e.g., ["orthodox", "power", "speed"])',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of videos to return (default: 3)',
            default: 3,
          },
        },
      },
    },
  },
];

/**
 * Create system prompt for Matt Goddard persona
 */
export function createSystemPrompt(context?: CoachingContext): string {
  // Build comprehensive user context from form data
  let userContext = '';
  
  if (context?.userProfile) {
    userContext += `USER PROFILE:\n`;
    userContext += `- Experience Level: ${context.userProfile.experience || 'Not specified'}\n`;
    userContext += `- Stance: ${context.userProfile.stance || 'Not specified'}\n`;
    if (context.userProfile.name) {
      userContext += `- Name: ${context.userProfile.name}\n`;
    }
    userContext += `\n`;
  }

  // Add form data context
  if (context?.formData) {
    const formData = context.formData;
    userContext += `COACHING REQUEST DETAILS:\n`;
    userContext += `- Category: ${formData.category || 'Not specified'}\n`;
    
    if (formData.category === 'Technique') {
      if (formData.technique) userContext += `- Technique: ${formData.technique}\n`;
      if (formData.techniqueFocus) userContext += `- Focus: ${formData.techniqueFocus}\n`;
    } else if (formData.category === 'Tactics' && formData.tacticalScenario) {
      userContext += `- Tactical Scenario: ${formData.tacticalScenario}\n`;
    } else if (formData.category === 'Training' && formData.trainingType) {
      userContext += `- Training Type: ${formData.trainingType}\n`;
    } else if (formData.category === 'Mindset' && formData.mindsetTopic) {
      userContext += `- Mindset Topic: ${formData.mindsetTopic}\n`;
    }
    
    if (formData.location) userContext += `- Training Location: ${formData.location}\n`;
    if (formData.timeAvailable) userContext += `- Time Available: ${formData.timeAvailable}\n`;
    if (formData.equipment && Array.isArray(formData.equipment) && formData.equipment.length > 0) {
      userContext += `- Equipment: ${formData.equipment.join(', ')}\n`;
    }
    if (formData.question) {
      userContext += `- Specific Question: ${formData.question}\n`;
    }
    userContext += `\n`;
  }

  return `You are Matt Goddard, "The Boxing Locker" - a 7-0 professional boxer and National Champion with 20+ years of ring experience.

VOICE & TONE:
- British, direct, and technical
- "No-nonsense" yet highly motivational
- Focus on biomechanics and proper form
- Emphasize the "Value of Looks" - proper form isn't just aesthetic, it's about efficiency, power, and injury prevention

CORE PHILOSOPHIES:
Always reference the Five Boxing Philosophies when relevant:
1. Brain - Strategic thinking and fight IQ
2. Legs - Footwork, movement, and positioning
3. Hands - Technique, speed, and power
4. Heart - Courage, determination, and will
5. Ego - Confidence balanced with humility

TEACHING APPROACH:
- Break down techniques step-by-step
- Explain the "why" behind each movement
- Provide biomechanical insights
- Give actionable drills and exercises
- ALWAYS use the search_video_library tool to find relevant videos when discussing techniques
- Provide 2-4 suggested follow-up actions as buttons for the user

${userContext}

IMPORTANT: 
- Use ALL the user's context provided above to give personalized coaching
- Match your coaching to their experience level (beginner needs basics, pro needs advanced techniques)
- Consider their stance (orthodox vs southpaw) when giving technique advice
- Respect their time constraints and training location
- When discussing any technique, tactic, or training method, ALWAYS call search_video_library to find relevant videos
- Provide 2-4 suggested follow-up actions as buttons for the user
- Make button labels concise and actionable (e.g., "Show me jab drills", "Explain footwork", "Watch video")
- Be specific, technical, and always aim to help the boxer improve their form and understanding
- If the user hasn't specified a technique/topic, ask them what they'd like to focus on, but still provide general guidance based on their experience level

STRUCTURED OUTPUT FORMAT:
When responding, format your response as JSON with this structure:
{
  "response": "Your main coaching response text here",
  "suggested_actions": [
    {
      "label": "Button text",
      "action": "ask_question" | "watch_video" | "explore_topic",
      "value": "The query or action value",
      "video_id": "optional video ID if action is watch_video"
    }
  ],
  "video_recommendations": [
    {
      "video_id": "youtube_video_id",
      "title": "Video title",
      "reason": "Why this video is relevant"
    }
  ]
}

Always return valid JSON, even if you don't have suggested actions or video recommendations.`;
}

/**
 * Call OpenRouter API for coaching with structured output
 */
export async function getCoachingResponse(
  messages: ChatMessage[],
  context?: CoachingContext,
  useStructuredOutput = false
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  const systemPrompt = createSystemPrompt(context);
  
  // Format messages for OpenRouter
  const formattedMessages = messages.map(msg => {
    if (msg.role === 'tool') {
      return {
        role: 'tool' as const,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
      };
    }
    if (msg.role === 'assistant' && msg.tool_calls) {
      return {
        role: 'assistant' as const,
        content: msg.content || null,
        tool_calls: msg.tool_calls,
      };
    }
    return {
      role: msg.role,
      content: msg.content,
    };
  });

  const allMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...formattedMessages,
  ];

  const body: any = {
    model: 'anthropic/claude-3-5-sonnet',
    messages: allMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2000,
    tools: videoSearchTools,
    tool_choice: 'auto',
  };

  // Add structured output if requested
  // OpenRouter supports json_schema for structured outputs (more powerful)
  // For Claude 3.5 Sonnet, we can use json_object (simpler) or json_schema (more control)
  if (useStructuredOutput) {
    // Update system prompt to emphasize JSON output
    const systemMsg = allMessages.find(m => m.role === 'system');
    if (systemMsg) {
      systemMsg.content = systemMsg.content + '\n\nCRITICAL: You MUST respond with valid JSON only. Use the structured format specified above. Do not include any text outside the JSON object.';
    }
    
    // Use json_schema for better control and validation
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'coaching_response',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description: 'The main coaching response text',
            },
            suggested_actions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                    description: 'Button label text',
                  },
                  action: {
                    type: 'string',
                    enum: ['ask_question', 'watch_video', 'explore_topic'],
                    description: 'Action type',
                  },
                  value: {
                    type: 'string',
                    description: 'The value/query for this action',
                  },
                  video_id: {
                    type: 'string',
                    description: 'YouTube video ID if action is watch_video',
                  },
                },
                required: ['label', 'action', 'value'],
              },
              description: 'Suggested follow-up actions as buttons (2-4 items)',
            },
            video_recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  video_id: { type: 'string' },
                  title: { type: 'string' },
                  reason: { type: 'string' },
                },
                required: ['video_id', 'title'],
              },
              description: 'Recommended videos to watch',
            },
          },
          required: ['response'],
          additionalProperties: false,
        },
      },
    };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'The Boxing Locker - AI Coach',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  return response;
}

/**
 * Extract video references from AI response text
 */
export function extractVideoReferences(text: string): Array<{
  videoId: string;
  timestamp?: number;
  description?: string;
}> {
  const patterns = [
    /(?:watch|see|check).*?at\s+([a-zA-Z0-9_-]{11})\s+(?:starting\s+at|at)\s+(\d+)(?::(\d+))?/gi,
    /\[([a-zA-Z0-9_-]{11})\]\s*(?:at|@)\s*(\d+)(?::(\d+))?/gi,
    /video_id:\s*([a-zA-Z0-9_-]{11})/gi,
    /\(video_id:\s*([a-zA-Z0-9_-]{11})\)/gi,
  ];

  const references: Array<{ videoId: string; timestamp?: number; description?: string }> = [];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const videoId = match[1];
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      const timestamp = minutes * 60 + seconds;

      references.push({
        videoId,
        timestamp: timestamp > 0 ? timestamp : undefined,
        description: match[0],
      });
    }
  }

  return references;
}
