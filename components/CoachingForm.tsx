'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoPlayer } from './VideoPlayer';
import { StreamdownMarkdown } from './StreamdownMarkdown';
import { Loader2, Sparkles } from 'lucide-react';

interface CoachingFormData {
  location?: 'Gym' | 'Home';
  timeAvailable?: '15min' | '30min' | '45min' | '1hr+';
  experience?: 'Beginner' | 'Intermediate' | 'Pro';
  stance?: 'Orthodox' | 'Southpaw' | 'Switch';
}

interface SuggestedAction {
  label: string;
  action: 'ask_question' | 'watch_video' | 'explore_topic';
  value: string;
  video_id?: string;
}

interface CoachingResponse {
  response: string;
  video_recommendations?: Array<{
    video_id: string;
    title: string;
    reason?: string;
  }>;
}

type LoadingStage = 
  | 'analyzing'
  | 'searching_videos'
  | 'generating'
  | 'finalizing';

interface LoadingStageInfo {
  stage: LoadingStage;
  label: string;
  description: string;
}

const LOADING_STAGES: LoadingStageInfo[] = [
  {
    stage: 'analyzing',
    label: 'Analyzing your needs',
    description: 'Reviewing your experience level, stance, and training context...',
  },
  {
    stage: 'searching_videos',
    label: 'Finding relevant videos',
    description: 'Searching Matt\'s video library for perfect demonstrations...',
  },
  {
    stage: 'generating',
    label: 'Generating coaching plan',
    description: 'Creating your personalised training program...',
  },
  {
    stage: 'finalizing',
    label: 'Finalizing your coaching',
    description: 'Putting the finishing touches on your plan...',
  },
];

export function CoachingForm() {
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('analyzing');
  const [parsedResponse, setParsedResponse] = useState<CoachingResponse | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ videoId: string; title: string; topic?: string; subtopic?: string } | null>(null);

  // Parse text and JSON from message parts (like ChatBot does)
function parseCoachingResponse(parts: any[]): {
  text: string;
  response: CoachingResponse | null;
} {
  if (!parts) return { text: '', response: null };

  const rawText = parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('');

  // Try to extract JSON block from the end of the response
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);

  let response: CoachingResponse | null = null;
  let cleanText = rawText;

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);

      // Parse coaching response
      if (parsed.response) {
        response = {
          response: parsed.response,
          video_recommendations: parsed.video_recommendations || [],
        };
      }

      // Remove JSON block from displayed text
      cleanText = rawText.replace(/```json[\s\S]*?```/, '').trim();
    } catch (e) {
      console.error('[Coach] Failed to parse JSON from response:', e);
    }
  }

  return { text: cleanText, response };
}

// State for manual streaming (since useChat with dynamic body is complex)
const [isLoadingManual, setIsLoadingManual] = useState(false);
const [messages, setMessages] = useState<any[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CoachingFormData>({
    defaultValues: {
      location: 'Gym',
      timeAvailable: '30min',
      experience: 'Beginner',
      stance: 'Orthodox',
    },
  });

  // Track loading stages based on messages
  const lastMessage = messages[messages.length - 1];
  if (lastMessage) {
    // Check for tool calls to update stage
    const hasToolCalls = lastMessage.parts?.some((p: any) => p.type === 'tool-call');
    const hasText = lastMessage.parts?.some((p: any) => p.type === 'text');
    
    if (hasToolCalls && loadingStage === 'analyzing') {
      setLoadingStage('searching_videos');
    } else if (hasText && loadingStage !== 'generating') {
      setLoadingStage('generating');
    }
  }

  const onSubmit = async (data: CoachingFormData) => {
    setIsLoadingManual(true);
    setLoadingStage('analyzing');
    setParsedResponse(null);
    setMessages([]);

    try {
      // Build simple coaching prompt for lead magnet
      const prompt = `I'm a ${data.experience || 'Beginner'} boxer with an ${data.stance || 'Orthodox'} stance. I train at ${data.location || 'Gym'} and have ${data.timeAvailable || '30 minutes'} available. Please provide personalised coaching based on my needs.`;

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          context: {
            formData: {
              location: data.location,
              timeAvailable: data.timeAvailable,
              experience: data.experience,
              stance: data.stance,
            },
            userProfile: {
              stance: data.stance,
              experience: data.experience,
            },
          },
          isLeadMagnet: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === ': OPENROUTER PROCESSING' || line.trim().startsWith(': OPENROUTER')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]' || data === '') continue;

            try {
              const parsed = JSON.parse(data);

              // Debug: Log all event types we receive
              console.log('[Coach Stream]', parsed.type, parsed);

              // Handle text-delta (AI SDK format uses 'delta' not 'textDelta')
              if (parsed.type === 'text-delta') {
                const delta = parsed.delta || parsed.textDelta || '';
                if (delta) {
                  fullResponse += delta;
                  console.log('[Coach] Received text-delta, total length:', fullResponse.length);
                  setMessages([{
                    id: '1',
                    role: 'assistant',
                    parts: [{ type: 'text', text: fullResponse }],
                    createdAt: new Date().toISOString(),
                  }]);
                }
              }

              // Handle other text events that might come from AI SDK
              if (parsed.type === 'text') {
                const text = parsed.text || '';
                if (text) {
                  fullResponse += text;
                  console.log('[Coach] Received text event, total length:', fullResponse.length);
                  setMessages([{
                    id: '1',
                    role: 'assistant',
                    parts: [{ type: 'text', text: fullResponse }],
                    createdAt: new Date().toISOString(),
                  }]);
                }
              }

              // Update loading stages
              if (parsed.type === 'tool-input-start') {
                setLoadingStage('searching_videos');
              }
              if (parsed.type === 'text-delta' || parsed.type === 'text') {
                setLoadingStage('generating');
              }
            } catch (e) {
              // Skip invalid JSON
              console.log('[Coach Stream] Invalid JSON:', data);
            }
          }
        }
      }

      console.log('[Coach] Stream complete, fullResponse length:', fullResponse.length);
      
      // Ensure we have the final message set
      if (fullResponse) {
        setMessages([{
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: fullResponse }],
          createdAt: new Date().toISOString(),
        }]);
      }

      // Parse final response
      const { response: parsedResponse } = parseCoachingResponse([{ type: 'text', text: fullResponse }]);
      if (parsedResponse) {
        console.log('[Coach] Parsed response successfully:', parsedResponse);
        setParsedResponse(parsedResponse);

        // Set video from recommendations if available
        if (parsedResponse.video_recommendations && parsedResponse.video_recommendations.length > 0) {
          const video = parsedResponse.video_recommendations[0];
          setSelectedVideo({
            videoId: video.video_id,
            title: video.title,
          });
        }
      } else {
        console.log('[Coach] No parsed response, showing raw text');
      }

    } catch (error: any) {
      console.error('Coaching error:', error);
      setMessages([{
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: `Error: ${error.message}` }],
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsLoadingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Your context</CardTitle>
            <CardDescription>Help me personalize your coaching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your experience level</Label>
                <Select
                  value={watch('experience')}
                  onValueChange={(value) => setValue('experience', value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Your stance</Label>
                <Select
                  value={watch('stance')}
                  onValueChange={(value) => setValue('stance', value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Orthodox">Orthodox</SelectItem>
                    <SelectItem value="Southpaw">Southpaw</SelectItem>
                    <SelectItem value="Switch">Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Where do you train?</Label>
                <Select
                  value={watch('location')}
                  onValueChange={(value) => setValue('location', value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gym">Gym</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time available</Label>
                <Select
                  value={watch('timeAvailable')}
                  onValueChange={(value) => setValue('timeAvailable', value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">15 minutes</SelectItem>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="45min">45 minutes</SelectItem>
                    <SelectItem value="1hr+">1 hour+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoadingManual}
                className="w-full"
              >
                {isLoadingManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting coaching...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get AI Coaching
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Loading Indicator with Stages */}
      {isLoadingManual && messages.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-boxing-red" />
              
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  {LOADING_STAGES.find(s => s.stage === loadingStage)?.label || 'Preparing your coaching...'}
                </h3>
                <p className="text-sm text-gray-400">
                  {LOADING_STAGES.find(s => s.stage === loadingStage)?.description || 'This will just take a moment...'}
                </p>
              </div>

              {/* Stage Progress Indicator */}
              <div className="w-full max-w-md space-y-3">
                {LOADING_STAGES.map((stageInfo, index) => {
                  const currentStageIndex = LOADING_STAGES.findIndex(s => s.stage === loadingStage);
                  const isActive = stageInfo.stage === loadingStage;
                  const isCompleted = currentStageIndex > index;
                  
                  return (
                    <div key={stageInfo.stage} className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isCompleted
                          ? 'bg-boxing-red text-white'
                          : isActive
                          ? 'bg-boxing-red/50 text-white border-2 border-boxing-red animate-pulse'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {stageInfo.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-gray-400 mt-0.5">{stageInfo.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Response */}
      {(messages.length > 0 && messages[messages.length - 1]?.role === 'assistant') && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-champion-gold" />
              Matt's Coaching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Response Text */}
            <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
              {(() => {
                const assistantMessage = messages[messages.length - 1];
                if (!assistantMessage) return null;

                // Parse response using the same method as ChatBot
                const { text, response } = parseCoachingResponse(assistantMessage.parts);

                // Set parsed response if found
                if (response && !parsedResponse) {
                  setParsedResponse(response);
                }

                // Use parsed response if available, otherwise show text
                const contentToRender = parsedResponse?.response || text || 'No response received';
                
                // Use Streamdown for markdown rendering
                return <StreamdownMarkdown content={contentToRender} />;
              })()}
            </div>

            {/* Video Recommendations */}
            {parsedResponse?.video_recommendations && parsedResponse.video_recommendations.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
                  Recommended Videos
                </h3>
                <div className="space-y-3">
                  {parsedResponse.video_recommendations.map((video, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedVideo({
                          videoId: video.video_id,
                          title: video.title,
                        });
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm mb-1">{video.title}</p>
                        {video.reason && (
                          <p className="text-gray-400 text-xs">{video.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                      >
                        Watch
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: Show video from tool calls if no structured recommendations */}
            {selectedVideo && !parsedResponse?.video_recommendations && (
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
                  Watch Matt Demonstrate
                </h3>
                <Button
                  onClick={() => {
                    // Video player will auto-open when selectedVideo is set
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Play Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal - Auto-open like chat app */}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          topic={selectedVideo.topic}
          subtopic={selectedVideo.subtopic}
          open={!!selectedVideo}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedVideo(null);
            }
          }}
        />
      )}
    </div>
  );
}

