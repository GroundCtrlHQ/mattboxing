# Testing the Voice Feature

## Quick Start Guide

### 1. Install the Package
First, install the Google GenAI package:
```bash
npm install @google/genai
```

### 2. Add Your Google API Key
Add your Google API key to `.env.local`:
```bash
GOOGLE_API_KEY=your_google_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

### 3. Start the Dev Server
```bash
npm run dev
```

### 4. Test the Voice Feature
Open your browser and navigate to:
```
http://localhost:3000/aivoice
```

Or if running on a different port, check the terminal output for the actual URL.

## How to Use

1. **Click "Connect"** - This establishes a connection to Gemini Live API
2. **Click the Microphone Button** - This starts/stops recording
3. **Speak** - Ask questions about boxing, training, etc.
4. **Listen** - The AI will respond with a British accent (Hampshire)
5. **View Conversation** - See the transcribed conversation below
6. **Generate PDF** - Click "Generate & Download Plan" to create your coaching plan PDF

## Troubleshooting

### "GOOGLE_API_KEY not set" error
- Make sure you added `GOOGLE_API_KEY` to `.env.local`
- Restart the dev server after adding the variable

### "Failed to connect" error
- Verify your API key is valid
- Check that Gemini Live API is enabled for your project
- Make sure the package is installed: `npm install @google/genai`

### Microphone not working
- Check browser permissions (should prompt for microphone access)
- Make sure you're using HTTPS or localhost (required for microphone access)
- Check browser console for errors

### Package not found
- Run `npm install @google/genai`
- If that doesn't work, try: `npm install @google/generative-ai` (alternative package name)

## Expected Behavior

- ✅ Connection status shows "Connected" when ready
- ✅ Microphone button turns red when recording
- ✅ Conversation appears in real-time
- ✅ AI responds with British accent
- ✅ PDF downloads when you click "Generate & Download Plan"

