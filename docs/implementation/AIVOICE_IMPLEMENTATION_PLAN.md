# AI Voice Implementation Plan

## Overview
Create a voice-based coaching experience using Google Gemini Voice Real-Time API that uses the FAQ markdown as context and outputs a lead magnet PDF similar to `/coach`.

## Implementation Checklist

### Phase 1: Setup & Dependencies
- [ ] Install `@google/genai` package
- [ ] Set up environment variable for `GOOGLE_API_KEY`
- [ ] Create `/app/aivoice/page.tsx` route
- [ ] Read and parse `MATT_GODDARD_FAQ.md` for system context

### Phase 2: Voice Interface Component
- [ ] Create `VoiceCoachInterface.tsx` component
- [ ] Implement microphone access and audio capture
- [ ] Set up Web Audio API for audio processing
- [ ] Handle audio format conversion (PCM, 16kHz sample rate)
- [ ] Implement real-time audio streaming to Gemini API

### Phase 3: Gemini Live API Integration
- [ ] Initialize Google GenAI client with API key
- [ ] Create live session connection using `ai.live.connect()`
- [ ] Configure system instruction from FAQ markdown
- [ ] Set up response modalities (AUDIO and TEXT)
- [ ] Implement message queue for handling responses
- [ ] Handle audio playback for AI responses

### Phase 4: Conversation Flow
- [ ] Start conversation with greeting/context
- [ ] Capture user voice input
- [ ] Stream audio to Gemini Live API
- [ ] Receive and play AI audio responses
- [ ] Display transcribed text in real-time
- [ ] Handle interruptions and turn-taking

### Phase 5: Lead Magnet Generation
- [ ] Collect conversation summary/transcript
- [ ] Extract key coaching points from conversation
- [ ] Generate structured coaching plan from voice interaction
- [ ] Create PDF using similar structure to `CoachingPlanPDF.tsx`
- [ ] Include conversation highlights and recommendations
- [ ] Add download functionality

### Phase 6: UI/UX
- [ ] Design voice interface with microphone button
- [ ] Show real-time transcription
- [ ] Display conversation history
- [ ] Add visual indicators for speaking/listening states
- [ ] Implement error handling and user feedback
- [ ] Add loading states and progress indicators

### Phase 7: Integration with Coach Page (Future)
- [ ] Add voice option as second column/choice in `/coach`
- [ ] Allow users to choose between form and voice
- [ ] Share PDF generation logic between both methods

## Technical Details

### Audio Requirements
- **Input Format**: PCM, 16kHz sample rate, mono channel, 16-bit depth
- **Output Format**: PCM, 24kHz sample rate (for playback)
- **Streaming**: Real-time chunks via `sendRealtimeInput()`

### API Configuration
```javascript
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
const config = {
  responseModalities: [Modality.AUDIO, Modality.TEXT],
  systemInstruction: FAQ_CONTENT, // From MATT_GODDARD_FAQ.md
};
```

### Key Components Needed
1. **VoiceCoachInterface.tsx** - Main voice interaction component
2. **VoicePlanPDF.tsx** - PDF generator for voice-based plans
3. **app/aivoice/page.tsx** - Route page
4. **lib/gemini-voice.ts** - Gemini Live API utilities

## Environment Variables
- `GOOGLE_API_KEY` - Google Gemini API key (user will add)

## Next Steps
1. Start with basic voice capture and playback
2. Integrate Gemini Live API
3. Add FAQ context as system instruction
4. Implement PDF generation
5. Polish UI/UX
6. Test end-to-end flow

