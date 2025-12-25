import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini-voice';

export async function POST(request: NextRequest) {
  try {
    const ai = getGeminiClient();
    
    // Generate an ephemeral token for client-side connection
    // This allows the browser to connect directly to Gemini Live safely
    // Generate a looser ephemeral token to avoid strict constraint failures
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    console.log('[Voice] Ephemeral Token generated');

    return NextResponse.json({
      token: token.name,
      model: 'models/gemini-2.5-flash-native-audio-preview-12-2025' // Live API audio model
    });
  } catch (error: any) {
    console.error('[Voice] Token generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate access token' },
      { status: 500 }
    );
  }
}

