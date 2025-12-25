# Google Gemini Live API - Developer Reference

> **Official Documentation for Real-Time Voice/Audio Streaming**
> 
> This reference contains code snippets from the official Google Gemini documentation for implementing real-time voice conversations.

---

## Table of Contents

1. [Overview](#overview)
2. [Models](#models)
3. [Installation](#installation)
4. [Authentication](#authentication)
5. [Ephemeral Tokens (Browser-Safe)](#ephemeral-tokens-browser-safe)
6. [Connecting to Live API](#connecting-to-live-api)
7. [Sending Audio Input](#sending-audio-input)
8. [Receiving Audio Output](#receiving-audio-output)
9. [Voice Configuration](#voice-configuration)
10. [System Instructions](#system-instructions)
11. [Voice Activity Detection (VAD)](#voice-activity-detection-vad)
12. [Complete Examples](#complete-examples)
13. [WebSocket Endpoints](#websocket-endpoints)
14. [Audio Format Reference](#audio-format-reference)

---

## Overview

The Gemini Live API enables real-time, bidirectional streaming communication with Google's Gemini models. It supports:

- **Real-time audio input** (16kHz PCM)
- **Real-time audio output** (24kHz PCM)
- **Text input/output**
- **Video/image input**
- **Voice Activity Detection (VAD)**
- **Interruption handling**

**Key Features:**
- Low-latency voice conversations
- Multiple voice options including British accents
- Session resumption
- Token-based billing

---

## Models

### Native Audio Models (Recommended for Voice)

```javascript
// Latest native audio model (recommended)
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

// Alternative models
const model = 'gemini-2.5-flash-native-audio-preview-09-2025';
const model = 'gemini-2.0-flash-live-preview-04-09';
```

---

## Installation

```bash
npm install @google/genai
```

---

## Authentication

### Server-Side (Node.js) - Use API Key

```javascript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});
```

### Client-Side (Browser) - Use Ephemeral Tokens

> ⚠️ **WARNING**: Never expose API keys in client-side code. Use ephemeral tokens instead.

```javascript
import { GoogleGenAI } from '@google/genai';

// Use ephemeral token (generated server-side)
const ai = new GoogleGenAI({
  apiKey: ephemeralToken,
  httpOptions: { apiVersion: 'v1alpha' }  // Required for ephemeral tokens
});
```

---

## Ephemeral Tokens (Browser-Safe)

Ephemeral tokens allow secure client-side connections without exposing your API key.

### Server-Side: Generate Token

```javascript
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
  httpOptions: { apiVersion: 'v1alpha' }  // Required for authTokens
});

const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

const token = await client.authTokens.create({
  config: {
    uses: 1,  // Single use token
    expireTime: expireTime,  // 30 minutes
    httpOptions: { apiVersion: 'v1alpha' }
  }
});

// Send token.name to client
console.log('Token:', token.name);
```

### Server-Side: Token with Model Constraints

```javascript
const token = await client.authTokens.create({
  config: {
    uses: 1,
    expireTime: expireTime,
    liveConnectConstraints: {
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        sessionResumption: {},
        temperature: 0.7,
        responseModalities: ['AUDIO']
      }
    },
    httpOptions: { apiVersion: 'v1alpha' }
  }
});
```

### Client-Side: Use Token

```javascript
import { GoogleGenAI, Modality } from '@google/genai';

// Token received from server
const ai = new GoogleGenAI({
  apiKey: token.name,  // Use token.name as apiKey
  httpOptions: { apiVersion: 'v1alpha' }
});

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: { responseModalities: [Modality.AUDIO] },
  callbacks: { /* ... */ }
});
```

---

## Connecting to Live API

### Basic Connection with Callbacks

```javascript
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseQueue = [];

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: {
    responseModalities: [Modality.AUDIO],
    systemInstruction: "You are a helpful assistant."
  },
  callbacks: {
    onopen: () => console.log('Connected to Gemini Live API'),
    onmessage: (message) => responseQueue.push(message),
    onerror: (e) => console.error('Error:', e.message),
    onclose: (e) => console.log('Closed:', e.reason)
  }
});
```

### Connection with AsyncQueue Pattern

```typescript
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

class AsyncQueue<T> {
  private queue: T[] = [];
  private waiting: ((value: T) => void)[] = [];

  put(item: T): void {
    if (this.waiting.length > 0) {
      this.waiting.shift()!(item);
    } else {
      this.queue.push(item);
    }
  }

  get(): Promise<T> {
    return new Promise<T>((resolve) => {
      if (this.queue.length > 0) {
        resolve(this.queue.shift()!);
      } else {
        this.waiting.push(resolve);
      }
    });
  }

  clear(): void {
    this.queue = [];
    this.waiting = [];
  }
}

const responseQueue = new AsyncQueue<LiveServerMessage>();

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  callbacks: {
    onopen: () => console.log('Live session opened'),
    onmessage: (message) => responseQueue.put(message),
    onerror: (e) => console.error('Session error:', e.message),
    onclose: (e) => {
      console.log('Session closed:', e.reason);
      responseQueue.clear();
    }
  },
  config: {
    responseModalities: [Modality.TEXT, Modality.AUDIO]
  }
});
```

---

## Sending Audio Input

### Send Real-Time Audio (PCM 16kHz)

```javascript
// Audio must be:
// - 16-bit PCM
// - 16kHz sample rate
// - Mono channel
// - Base64 encoded

session.sendRealtimeInput({
  audio: {
    data: base64AudioData,  // Base64 encoded PCM
    mimeType: "audio/pcm;rate=16000"
  }
});
```

### Browser: Capture Microphone Audio

```javascript
// Create AudioContext at 16kHz
const audioContext = new AudioContext({ sampleRate: 16000 });

// Get microphone stream
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
});

// Create audio processor
const source = audioContext.createMediaStreamSource(stream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

processor.onaudioprocess = (e) => {
  const inputData = e.inputBuffer.getChannelData(0);
  
  // Convert Float32 to Int16 PCM
  const pcmData = new Int16Array(inputData.length);
  for (let i = 0; i < inputData.length; i++) {
    const s = Math.max(-1, Math.min(1, inputData[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Convert to Base64
  const bytes = new Uint8Array(pcmData.buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Audio = btoa(binary);

  // Send to Gemini
  session.sendRealtimeInput({
    audio: {
      data: base64Audio,
      mimeType: "audio/pcm;rate=16000"
    }
  });
};

source.connect(processor);
processor.connect(audioContext.destination);
```

### AudioWorklet Processor (Modern Approach)

```javascript
class AudioProcessingWorklet extends AudioWorkletProcessor {
  buffer = new Int16Array(2048);
  bufferWriteIndex = 0;

  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      this.processChunk(channel0);
    }
    return true;
  }

  sendAndClearBuffer() {
    this.port.postMessage({
      event: "chunk",
      data: {
        int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer
      }
    });
    this.bufferWriteIndex = 0;
  }

  processChunk(float32Array) {
    for (let i = 0; i < float32Array.length; i++) {
      const int16Value = float32Array[i] * 32768;
      this.buffer[this.bufferWriteIndex++] = int16Value;
      if (this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }
  }
}

registerProcessor('audio-recorder-worklet', AudioProcessingWorklet);
```

### Signal End of Audio Stream

```javascript
session.sendRealtimeInput({ audioStreamEnd: true });
```

---

## Receiving Audio Output

### Process Incoming Messages

```javascript
async function messageLoop() {
  while (true) {
    const message = await responseQueue.get();
    
    // Handle interruption (user started speaking)
    if (message.serverContent?.interrupted) {
      audioQueue.length = 0;  // Clear playback queue
      continue;
    }
    
    // Process model response
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        // Handle audio data (24kHz PCM, base64 encoded)
        if (part.inlineData?.data) {
          const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
          audioQueue.push(audioBuffer);
        }
        
        // Handle text transcript
        if (part.text) {
          console.log('Text:', part.text);
        }
      }
    }
    
    // Check for turn complete
    if (message.serverContent?.turnComplete) {
      console.log('Turn complete');
    }
  }
}
```

### Browser: Play Audio with Web Audio API

```javascript
// Output audio is 24kHz, 16-bit PCM
const playbackContext = new AudioContext({ sampleRate: 24000 });

async function playAudio(base64Data) {
  // Decode base64 to ArrayBuffer
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Wrap PCM in WAV header for browser playback
  const wavBuffer = createWavHeader(bytes.buffer, 24000);
  
  // Decode and play
  const audioBuffer = await playbackContext.decodeAudioData(wavBuffer);
  const source = playbackContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(playbackContext.destination);
  source.start();
}

function createWavHeader(pcmBuffer, sampleRate) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  view.setUint32(0, 0x52494646, false);  // "RIFF"
  view.setUint32(4, 36 + pcmBuffer.byteLength, true);
  view.setUint32(8, 0x57415645, false);  // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, 1, true);  // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmBuffer.byteLength, true);

  // Combine header and PCM data
  const wavBuffer = new ArrayBuffer(44 + pcmBuffer.byteLength);
  const wavView = new Uint8Array(wavBuffer);
  wavView.set(new Uint8Array(header), 0);
  wavView.set(new Uint8Array(pcmBuffer), 44);
  
  return wavBuffer;
}
```

---

## Voice Configuration

### Available Voices

| Voice Name | Description |
|------------|-------------|
| `Puck` | Default voice |
| `Charon` | Male voice |
| `Kore` | **British Male** ✓ |
| `Fenrir` | Male voice |
| `Aoede` | Female voice |
| `Zephyr` | Female voice |

### Configure Voice in Connection

```javascript
const config = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Kore"  // British Male voice
      }
    }
  }
};

const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: config,
  callbacks: { /* ... */ }
});
```

### Python Equivalent

```python
config = {
    "response_modalities": ["AUDIO"],
    "speech_config": {
        "voice_config": {
            "prebuilt_voice_config": {
                "voice_name": "Kore"
            }
        }
    }
}
```

---

## System Instructions

```javascript
const config = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: `You are Matt Goddard, a world-class British boxing coach.
  
<IMPORTANT>
- Speak ONLY in character as Matt Goddard.
- Use a strong British accent (South London style).
- Use British boxing slang like "top-tier", "sorted", "proper", "get stuck in".
- Be encouraging but technically direct.
</IMPORTANT>

Answer questions about boxing technique and training.`,
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: "Kore"
      }
    }
  }
};
```

---

## Voice Activity Detection (VAD)

### Automatic VAD (Default)

VAD is enabled by default. The model automatically detects when the user starts/stops speaking.

### Configure VAD Sensitivity

```javascript
import { StartSensitivity, EndSensitivity } from '@google/genai';

const config = {
  responseModalities: [Modality.TEXT],
  realtimeInputConfig: {
    automaticActivityDetection: {
      disabled: false,  // VAD enabled (default)
      startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
      endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
      prefixPaddingMs: 20,
      silenceDurationMs: 100
    }
  }
};
```

### Disable Automatic VAD (Manual Control)

```javascript
const config = {
  responseModalities: [Modality.TEXT],
  realtimeInputConfig: {
    automaticActivityDetection: {
      disabled: true
    }
  }
};

// Manually signal speech boundaries
session.sendRealtimeInput({ activityStart: {} });

session.sendRealtimeInput({
  audio: {
    data: base64Audio,
    mimeType: "audio/pcm;rate=16000"
  }
});

session.sendRealtimeInput({ activityEnd: {} });
```

---

## Complete Examples

### Full Node.js Example with Microphone

```javascript
import { GoogleGenAI, Modality } from '@google/genai';
import mic from 'mic';
import Speaker from 'speaker';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const model = 'gemini-2.5-flash-native-audio-preview-12-2025';
const config = {
  responseModalities: [Modality.AUDIO],
  systemInstruction: "You are a helpful and friendly AI assistant.",
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: "Kore" }
    }
  }
};

async function live() {
  const responseQueue = [];
  const audioQueue = [];
  let speaker;

  async function waitMessage() {
    while (responseQueue.length === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    return responseQueue.shift();
  }

  function createSpeaker() {
    speaker = new Speaker({
      channels: 1,
      bitDepth: 16,
      sampleRate: 24000,
    });
  }

  async function messageLoop() {
    while (true) {
      const message = await waitMessage();
      
      if (message.serverContent?.interrupted) {
        audioQueue.length = 0;
        continue;
      }
      
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            audioQueue.push(Buffer.from(part.inlineData.data, 'base64'));
          }
        }
      }
    }
  }

  async function playbackLoop() {
    while (true) {
      if (audioQueue.length === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      } else {
        if (!speaker) createSpeaker();
        const chunk = audioQueue.shift();
        await new Promise((resolve) => {
          speaker.write(chunk, () => resolve());
        });
      }
    }
  }

  // Start loops
  messageLoop();
  playbackLoop();

  // Connect to Gemini Live API
  const session = await ai.live.connect({
    model: model,
    config: config,
    callbacks: {
      onopen: () => console.log('Connected to Gemini Live API'),
      onmessage: (message) => responseQueue.push(message),
      onerror: (e) => console.error('Error:', e.message),
      onclose: (e) => console.log('Closed:', e.reason),
    },
  });

  // Setup Microphone
  const micInstance = mic({
    rate: '16000',
    bitwidth: '16',
    channels: '1',
  });

  const micInputStream = micInstance.getAudioStream();
  
  micInputStream.on('data', (data) => {
    session.sendRealtimeInput({
      audio: {
        data: data.toString('base64'),
        mimeType: "audio/pcm;rate=16000"
      }
    });
  });

  micInstance.start();
  console.log('Microphone started. Speak now...');
}

live().catch(console.error);
```

---

## WebSocket Endpoints

### v1alpha (Required for Ephemeral Tokens)

```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent
```

### v1beta

```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
```

---

## Audio Format Reference

### Input Audio (Client → Gemini)

| Property | Value |
|----------|-------|
| Format | PCM (raw) |
| Sample Rate | **16,000 Hz** |
| Bit Depth | 16-bit signed |
| Channels | Mono (1) |
| Encoding | Base64 |
| MIME Type | `audio/pcm;rate=16000` |

### Output Audio (Gemini → Client)

| Property | Value |
|----------|-------|
| Format | PCM (raw) |
| Sample Rate | **24,000 Hz** |
| Bit Depth | 16-bit signed |
| Channels | Mono (1) |
| Encoding | Base64 |

---

## Error Handling

### Common Errors

| Error Code | Cause | Solution |
|------------|-------|----------|
| `1006` | WebSocket closed abnormally | Check API key, model name, region |
| `1007` | Invalid argument | Check config structure, API version |
| `403` | Permission denied | Check API key permissions |

### Handle Errors

```javascript
callbacks: {
  onerror: (e) => {
    console.error('WebSocket Error:', e);
    // Reconnect logic here
  },
  onclose: (e) => {
    console.log('WebSocket Closed - Code:', e.code, 'Reason:', e.reason);
    if (e.code !== 1000) {
      // Abnormal close, attempt reconnect
    }
  }
}
```

---

## Official Documentation Links

- [Gemini Live API Overview](https://ai.google.dev/gemini-api/docs/live)
- [Live API Capabilities Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [Ephemeral Tokens](https://ai.google.dev/gemini-api/docs/ephemeral-tokens)
- [Session Management](https://ai.google.dev/gemini-api/docs/live-session)
- [Vertex AI Live API](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api)
- [JS SDK GitHub](https://github.com/googleapis/js-genai)

---

## Quick Reference Card

```javascript
// 1. Import
import { GoogleGenAI, Modality } from '@google/genai';

// 2. Initialize (with ephemeral token for browser)
const ai = new GoogleGenAI({
  apiKey: token.name,
  httpOptions: { apiVersion: 'v1alpha' }
});

// 3. Connect
const session = await ai.live.connect({
  model: 'gemini-2.5-flash-native-audio-preview-12-2025',
  config: {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Kore' }
      }
    }
  },
  callbacks: {
    onopen: () => console.log('Connected'),
    onmessage: (msg) => handleMessage(msg),
    onerror: (e) => console.error(e),
    onclose: (e) => console.log('Closed')
  }
});

// 4. Send audio (16kHz PCM, base64)
session.sendRealtimeInput({
  audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' }
});

// 5. End stream
session.sendRealtimeInput({ audioStreamEnd: true });

// 6. Close
session.close();
```

---

*Last Updated: December 2025*
*Source: Official Google Gemini Documentation*

