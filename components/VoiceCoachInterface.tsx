'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mic, MicOff, Download, Loader2, Volume2, VolumeX } from 'lucide-react';
import { generateVoicePlanPDF, VoicePlanData } from './VoicePlanPDF';
import { Badge } from '@/components/ui/badge';
import { GoogleGenAI, Modality, Type } from '@google/genai';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// Tool declaration for generating coaching plan
const generatePlanTool = {
  functionDeclarations: [{
    name: 'generate_coaching_plan',
    description: 'Generate a personalised boxing coaching plan PDF based on the conversation. Call this when the user asks for their plan, wants a summary, or the coaching session is wrapping up.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        planTitle: {
          type: Type.STRING,
          description: 'A catchy title for the coaching plan'
        },
        summary: {
          type: Type.STRING,
          description: 'A brief summary of the coaching advice given'
        },
        keyPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of 3-5 key takeaways from the session'
        },
        nextSteps: {
          type: Type.STRING,
          description: 'Recommended next steps for the boxer'
        }
      },
      required: ['planTitle', 'summary', 'keyPoints', 'nextSteps']
    }
  }]
};

export function VoiceCoachInterface() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<VoicePlanData | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const playbackAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const startTimeRef = useRef<Date | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio context and cleanup
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
      }
      if (playbackAudioContextRef.current) {
        playbackAudioContextRef.current.close();
      }
      if (sessionRef.current) {
        sessionRef.current.close();
      }
    };
  }, []);

  // Convert Int16 PCM to Float32 for Web Audio API (higher quality)
  const int16ToFloat32 = (int16Array: Int16Array): Float32Array => {
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  };

  // Initialize high-quality playback context
  const initPlaybackContext = () => {
    if (!playbackAudioContextRef.current || playbackAudioContextRef.current.state === 'closed') {
      // Create at 24kHz to match Gemini output - no resampling needed
      playbackAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      
      // Create gain node for smooth volume control
      gainNodeRef.current = playbackAudioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;
      gainNodeRef.current.connect(playbackAudioContextRef.current.destination);
      
      nextPlayTimeRef.current = 0;
      console.log('[Voice] High-quality playback context created at 24kHz');
    }
  };

  // Seamless audio playback - schedules chunks without gaps
  const scheduleAudioPlayback = () => {
    if (audioQueueRef.current.length === 0 || !playbackAudioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const ctx = playbackAudioContextRef.current;
    
    // Resume if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Process all queued audio chunks
    while (audioQueueRef.current.length > 0) {
      const floatData = audioQueueRef.current.shift()!;
      
      // Create audio buffer
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
      audioBuffer.copyToChannel(floatData, 0);
      
      // Create source node
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current || ctx.destination);
      
      // Schedule seamlessly - no gaps between chunks
      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
      
      // Set up callback for when last chunk finishes
      source.onended = () => {
        if (audioQueueRef.current.length > 0) {
          scheduleAudioPlayback();
        } else {
          isPlayingRef.current = false;
        }
      };
    }
  };

  // Handle tool call - generate PDF
  const handleToolCall = async (functionCall: any) => {
    console.log('[Voice] Tool call received:', functionCall.name);
    
    if (functionCall.name === 'generate_coaching_plan') {
      setIsGeneratingPlan(true);
      
      try {
        const args = functionCall.args || {};
        
        // Generate the PDF with the AI's structured data
        const planData: VoicePlanData = {
          transcript: transcript || 'Voice coaching session with Freya Mills',
          summary: args.summary || 'Personalised boxing coaching session',
          keyPoints: args.keyPoints || ['Keep your guard up', 'Work on footwork', 'Stay relaxed'],
          duration: startTimeRef.current 
            ? `${Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 60000)} mins` 
            : 'N/A',
        };
        
        // Add title and next steps to the PDF
        generateVoicePlanPDF({
          ...planData,
          planTitle: args.planTitle,
          nextSteps: args.nextSteps,
        } as any);
        
        // Send tool response back to model
        if (sessionRef.current) {
          sessionRef.current.sendToolResponse({
            functionResponses: [{
              id: functionCall.id,
              name: functionCall.name,
              response: { success: true, message: 'Plan generated and downloaded successfully!' }
            }]
          });
        }
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: `✅ Your personalised coaching plan "${args.planTitle}" has been generated and downloaded!`,
          timestamp: new Date()
        }]);
        
      } catch (err) {
        console.error('[Voice] Error generating plan:', err);
        // Send error response
        if (sessionRef.current) {
          sessionRef.current.sendToolResponse({
            functionResponses: [{
              id: functionCall.id,
              name: functionCall.name,
              response: { success: false, error: 'Failed to generate plan' }
            }]
          });
        }
      } finally {
        setIsGeneratingPlan(false);
      }
    }
  };

  // Handle incoming messages from Gemini
  const handleGeminiMessage = (message: any) => {
    // Handle tool calls from the model
    if (message.toolCall?.functionCalls) {
      for (const fc of message.toolCall.functionCalls) {
        handleToolCall(fc);
      }
      return;
    }
    
    // Handle server content (audio/text responses)
    if (message.serverContent) {
      // Check for interruption - stop playback immediately
      if (message.serverContent.interrupted) {
        console.log('[Voice] User interrupted, clearing audio');
        audioQueueRef.current = [];
        nextPlayTimeRef.current = 0;
        isPlayingRef.current = false;
        return;
      }
      
      // Process model response parts
      if (message.serverContent.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          // Handle audio data - convert to high-quality Float32
          if (part.inlineData?.data) {
            try {
              // Decode base64 to Int16 PCM
              const binaryString = atob(part.inlineData.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Convert Int16 to Float32 for higher quality playback
              const int16Data = new Int16Array(bytes.buffer);
              const floatData = int16ToFloat32(int16Data);
              
              audioQueueRef.current.push(floatData);
              
              // Schedule seamless playback
              if (!isPlayingRef.current) {
                scheduleAudioPlayback();
              }
            } catch (e) {
              console.error('[Voice] Error processing audio:', e);
            }
          }
          
          // Handle text transcript - filter out AI thinking/planning text
          if (part.text) {
            const text = part.text.trim();
            
            // Skip internal reasoning/planning text
            const isThinking = 
              text.startsWith('**') || 
              text.includes('Responding') ||
              text.includes('Figuring') ||
              text.includes('I\'m just') ||
              text.includes('Trying to') ||
              text.includes('I\'m getting');
            
            if (!isThinking && text.length > 0) {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: text, 
                timestamp: new Date() 
              }]);
              // Also update transcript for PDF
              setTranscript(prev => prev + '\n\nFreya: ' + text);
            }
          }
        }
      }
    }
  };

  const connectToGemini = async () => {
    console.log('[Voice] Connect button clicked - starting connection process');

    try {
      setError(null);
      console.log('[Voice] Clearing any previous errors');

      // Initialize high-quality playback on user gesture (required by browsers)
      initPlaybackContext();

      // 1. Get FAQ content
      console.log('[Voice] Fetching FAQ content...');
      let faqContent = '';
      try {
        const faqResponse = await fetch('/api/voice/faq');
        console.log('[Voice] FAQ response status:', faqResponse.status);
        if (faqResponse.ok) {
          const data = await faqResponse.json();
          faqContent = data.content || '';
          console.log('[Voice] FAQ content loaded, length:', faqContent.length);
        } else {
          console.warn('[Voice] FAQ fetch failed, using fallback');
          faqContent = 'Matt Goddard is a 7-0 professional boxer and National Champion with 20+ years of ring experience.';
        }
      } catch (error) {
        console.error('[Voice] Error loading FAQ:', error);
        faqContent = 'Matt Goddard is a 7-0 professional boxer and National Champion with 20+ years of ring experience.';
      }

      // 2. Get Ephemeral Token
      console.log('[Voice] Fetching ephemeral token...');
      const tokenResponse = await fetch('/api/voice/connect', { method: 'POST' });
      console.log('[Voice] Token response status:', tokenResponse.status);
      const { token, model } = await tokenResponse.json();
      console.log('[Voice] Token received, model:', model);

      console.log('[Voice] Initializing session with model:', model);

      // 3. Initialize Gemini Live
      console.log('[Voice] Creating GoogleGenAI client with v1alpha for ephemeral tokens...');
      const ai = new GoogleGenAI({
        apiKey: token,
        httpOptions: { apiVersion: 'v1alpha' } // Required for ephemeral token support
      });
      console.log('[Voice] GoogleGenAI client created');

      const systemInstruction = `You are Freya Mills - a British boxing coach. Be warm, direct, and natural. Use British expressions like "brilliant", "lovely", "right then".

Give helpful, complete responses - not too short, not too long. Like a real gym conversation. No planning text or thinking out loud.

You can generate a coaching plan when asked - use 'generate_coaching_plan' tool.

Background: ${faqContent ? faqContent.substring(0, 400) : 'Matt Goddard is a 7-0 professional boxer and National Champion with 20+ years of ring experience.'}`;

      const session = await ai.live.connect({
        model: model,
        config: {
          responseModalities: ['AUDIO'] as any,
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede' // British Female voice for Freya Mills
              }
            }
          },
          // Enable automatic VAD - balanced for natural conversation
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              // Use numeric values: sensitivity 0.0-1.0, duration in seconds
            }
          },
          tools: [generatePlanTool]
        },
        callbacks: {
          onopen: () => {
            console.log('[Voice] WebSocket connected to Gemini Live API');
          },
          onmessage: (message: any) => {
            handleGeminiMessage(message);
          },
          onerror: (e: any) => {
            console.error('[Voice] WebSocket Error:', e);
            setError('Connection error - please try again');
            setIsConnected(false);
          },
          onclose: (e: any) => {
            console.log('[Voice] WebSocket Closed - Code:', e?.code, 'Reason:', e?.reason);
            setIsConnected(false);
          },
        }
      });

      // Assign session and update state AFTER connect resolves
      sessionRef.current = session;
      setIsConnected(true);
      startTimeRef.current = new Date();

      console.log('[Voice] Session established and ready for voice input!');

    } catch (err: any) {
      console.error('[Voice] Connection error:', err);
      setError('Connection Error: ' + err.message);
    }
  };

  const startRecording = async () => {
    try {
      if (!isConnected) await connectToGemini();
      
      // Create input AudioContext at 16kHz for microphone capture
      if (!inputAudioContextRef.current || inputAudioContextRef.current.state === 'closed') {
        console.log('[Voice] Creating input AudioContext at 16kHz...');
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000, 
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true 
        } 
      });
      mediaStreamRef.current = stream;
      console.log('[Voice] Microphone stream obtained');

      const source = inputAudioContextRef.current.createMediaStreamSource(stream);
      // Smaller buffer (2048) = ~128ms chunks for faster streaming
      const processor = inputAudioContextRef.current.createScriptProcessor(2048, 1, 1);

      processor.onaudioprocess = (e) => {
        // Use ref for current state check (closures capture stale state)
        if (!sessionRef.current || !isRecordingRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp to Int16 range
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64 for Gemini
        const bytes = new Uint8Array(pcmData.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        // Send audio to Gemini Live
        sessionRef.current.sendRealtimeInput({
          audio: {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000"
          }
        });
      };

      source.connect(processor);
      processor.connect(inputAudioContextRef.current.destination);
      isRecordingRef.current = true;
      setIsRecording(true);
      console.log('[Voice] Recording started - speak now!');
    } catch (err: any) {
      console.error('[Voice] Recording error:', err);
      setError('Microphone access denied or error: ' + err.message);
    }
  };

  const stopRecording = () => {
    console.log('[Voice] Stopping recording...');
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({ audioStreamEnd: true });
      console.log('[Voice] Audio stream end sent to Gemini');
    }
  };

  const endSession = () => {
    console.log('[Voice] Ending session...');
    
    // Stop recording first
    if (isRecording) {
      stopRecording();
    }
    
    // Clear audio queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    
    // Close session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.log('[Voice] Session already closed');
      }
      sessionRef.current = null;
    }
    
    // Close audio contexts
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (playbackAudioContextRef.current && playbackAudioContextRef.current.state !== 'closed') {
      playbackAudioContextRef.current.close();
      playbackAudioContextRef.current = null;
    }
    
    setIsConnected(false);
    console.log('[Voice] Session ended');
  };

  const generatePlan = () => {
    // Generate even if transcript is empty - use messages
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) {
      setError('Have a conversation with Freya first before generating a plan!');
      return;
    }
    
    const fullTranscript = messages.map(m => 
      `${m.role === 'user' ? 'You' : 'Freya'}: ${m.text}`
    ).join('\n\n');
    
    const planData: VoicePlanData = {
      transcript: fullTranscript || 'Voice coaching session',
      summary: assistantMessages.map(m => m.text).join('\n\n'),
      keyPoints: assistantMessages.slice(0, 5).map(m => m.text.substring(0, 150)),
      duration: startTimeRef.current ? `${Math.round((new Date().getTime() - startTimeRef.current.getTime()) / 60000)} mins` : 'N/A',
    };
    generateVoicePlanPDF(planData);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-charcoal border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white text-2xl font-bold">
            <Mic className="h-6 w-6 text-boxing-red" />
            Live Voice Coaching
          </CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Direct audio connection to Freya Mills (British Accent)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className={`font-bold ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
                {isConnected ? 'COACH ONLINE' : 'COACH OFFLINE'}
              </span>
            </div>
            {!isConnected ? (
              <Button onClick={connectToGemini} className="bg-boxing-red hover:bg-red-700 text-white font-bold px-6 py-2 rounded-full transition-all active:scale-95 shadow-lg">
                Connect Voice
              </Button>
            ) : (
              <Button onClick={endSession} variant="outline" className="text-white border-gray-700 hover:bg-white/10 rounded-full px-6">
                End Session
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800/50 text-red-400 rounded-xl text-center font-medium animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-6 py-12">
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 bg-boxing-red/20 rounded-full animate-ping scale-150" />
              )}
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!isConnected}
                size="lg"
                className={`w-40 h-40 rounded-full transition-all duration-500 relative z-10 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_40px_rgba(220,38,38,0.6)] scale-110' 
                    : 'bg-boxing-red hover:bg-red-700 hover:scale-105 shadow-xl'
                }`}
              >
                {isRecording ? <MicOff className="h-16 w-16" /> : <Mic className="h-16 w-16" />}
              </Button>
            </div>
            <div className="text-center space-y-2">
              <p className={`text-xl font-bold tracking-tight ${isRecording ? 'text-white' : 'text-gray-400'}`}>
                {isRecording ? 'Freya is listening...' : isConnected ? 'Tap to start speaking' : 'Connect to Freya first'}
              </p>
              {isRecording && (
                <div className="flex gap-1 justify-center items-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-1 bg-boxing-red rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {messages.length > 0 && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar bg-black/20 p-6 rounded-2xl border border-gray-800/50 shadow-inner">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-base leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-boxing-red text-white shadow-md rounded-tr-none' 
                      : 'bg-gray-800 text-gray-200 border border-gray-700 shadow-md rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isGeneratingPlan && (
            <div className="p-4 bg-green-900/20 border border-green-800/50 text-green-400 rounded-xl text-center font-medium animate-pulse flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Freya is creating your personalised plan...
            </div>
          )}

          {messages.length > 0 && !isRecording && !isGeneratingPlan && (
            <div className="pt-4">
              <Button 
                onClick={generatePlan} 
                className="w-full bg-champion-gold text-charcoal font-black text-lg py-8 rounded-2xl hover:bg-yellow-500 hover:scale-[1.02] transition-all shadow-xl active:scale-95 flex flex-col gap-1 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Download className="h-6 w-6" /> 
                  GENERATE YOUR CUSTOM PLAN
                </div>
                <span className="text-xs opacity-70 font-bold uppercase tracking-widest">Or ask Freya to "generate my plan"</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
