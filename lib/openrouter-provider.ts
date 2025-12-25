/**
 * OpenRouter provider for Vercel AI SDK
 * Based on OpenRouter's AI SDK patterns
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
});

