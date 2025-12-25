# AI Voice Setup Instructions

## Overview
The `/aivoice` page has been created with Google Gemini Voice Real-Time API integration. This allows users to have real-time voice conversations with Matt's AI coach and generate personalised PDF coaching plans.

## What Was Created

### Pages
- `/app/aivoice/page.tsx` - Main voice coaching page

### Components
- `components/VoiceCoachInterface.tsx` - Main voice interaction component (handles direct WebSocket connection)
- `components/VoicePlanPDF.tsx` - PDF generator for voice-based coaching plans

### API Routes
- `/app/api/voice/connect/route.ts` - Generates secure ephemeral tokens for client-side connection
- `/app/api/voice/faq/route.ts` - Serves FAQ content for system instruction

### Utilities
- `lib/gemini-voice.ts` - Gemini API client and configuration

## Setup Steps

### 1. Install Dependencies
```bash
npm install @google/genai bufferutil utf-8-validate
```

### 2. Add Environment Variable
Add your Google API key to your environment variables:

```bash
# .env.local
GOOGLE_API_KEY=your_google_api_key_here
```

You can get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Verify FAQ File Location
Ensure `MATT_GODDARD_FAQ.md` is in the project root directory. The API route at `/api/voice/faq` reads this file to create the system instruction for the AI coach.

## How It Works

1. **User clicks Connect** - The browser calls `/api/voice/connect` to get a temporary **ephemeral token**.
2. **Direct WebSocket Connection** - The browser establishes a direct WebSocket connection to Google's Gemini Live API using the token.
3. **Voice Recording** - The browser captures 16kHz PCM audio from your microphone and streams it directly to Gemini.
4. **Real-time Responses** - Gemini streams back audio data (24kHz) and text transcripts.
5. **PDF Generation** - After the session, you can generate a professional PDF summary of the conversation.

## Technical Details

### Audio Format
- **Input**: PCM, 16kHz sample rate, mono, 16-bit
- **Output**: PCM, 24kHz sample rate (played back via Web Audio API)

### Model
- Uses `gemini-2.5-flash-native-audio-preview-12-2025` for voice interactions

### Security
- **No API Keys in Browser**: Uses server-generated ephemeral tokens that expire after 10 minutes.
- **Direct Streaming**: Lower latency by bypassing the server for audio data.

## Next Steps

1. **Visit `/aivoice`** - Test the connection.
2. **Check Console** - Look for `[Voice]` logs in the browser developer tools.
3. **Speak to Matt** - Test the British accent and coaching expertise.

## Troubleshooting

### "Gemini error: {}" or silent disconnects
- This is often due to **Region Restrictions**. Gemini Live API is not available in all countries yet (e.g., EU/UK might have restrictions in AI Studio).
- Ensure your API key has **Gemini 2.0 Flash** permissions.
- Check if your firewall blocks WebSockets to `*.googleapis.com`.

### "bufferUtil.mask is not a function"
- Run `npm install bufferutil utf-8-validate` to provide the native WebSocket extensions needed by the SDK.
