/**
 * Gemini Voice Real-Time API Utilities
 * Handles connection to Google Gemini Live API for voice interactions
 */

import { GoogleGenAI, Modality } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }
    // Initialize with API key - works for both browser and Node.js
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { apiVersion: 'v1alpha' } // Required for ephemeral tokens
    });
  }
  return aiClient;
}

export interface VoiceSessionConfig {
  systemInstruction?: string;
  responseModalities?: Modality[];
}

export const DEFAULT_CONFIG: VoiceSessionConfig = {
  responseModalities: [Modality.AUDIO, Modality.TEXT],
};

/**
 * Create a live session configuration with British voice
 */
export function createLiveConfig(systemInstruction?: string) {
  return {
    responseModalities: [Modality.AUDIO, Modality.TEXT] as Modality[],
    systemInstruction: systemInstruction || 'You are a helpful boxing coach assistant.',
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Kore', // Male voice - can be changed to other available voices
        },
      },
    },
  };
}

/**
 * Model to use for voice interactions
 */
export const VOICE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

