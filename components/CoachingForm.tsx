'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlayer } from './VideoPlayer';
import { Loader2, Sparkles } from 'lucide-react';

type Category = 'Technique' | 'Tactics' | 'Training' | 'Mindset';

interface CoachingFormData {
  category: Category;
  // Technique fields
  technique?: 'Jab' | 'Cross' | 'Hook' | 'Uppercut' | 'Footwork' | 'Defense' | 'Guard' | 'Stance';
  techniqueFocus?: 'Power' | 'Speed' | 'Form' | 'Range';
  // Tactics fields
  tacticalScenario?: 'Combination' | 'Distance' | 'Counter' | 'Angle' | 'Timing';
  // Training fields
  trainingType?: 'Drill' | 'Workout' | 'Conditioning' | 'Sparring';
  // Mindset fields
  mindsetTopic?: 'Confidence' | 'Focus' | 'Discipline' | 'Motivation';
  // Phase 3 - Context
  location?: 'Gym' | 'Home';
  equipment?: string[];
  timeAvailable?: '15min' | '30min' | '45min' | '1hr+';
  experience?: 'Beginner' | 'Intermediate' | 'Pro';
  stance?: 'Orthodox' | 'Southpaw' | 'Switch';
  question?: string;
}

interface SuggestedAction {
  label: string;
  action: 'ask_question' | 'watch_video' | 'explore_topic';
  value: string;
  video_id?: string;
}

interface CoachingResponse {
  response: string;
  suggested_actions?: SuggestedAction[];
  video_recommendations?: Array<{
    video_id: string;
    title: string;
    reason?: string;
  }>;
}

export function CoachingForm() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [parsedResponse, setParsedResponse] = useState<CoachingResponse | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ videoId: string; title: string; topic?: string; subtopic?: string } | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CoachingFormData>({
    defaultValues: {
      category: 'Technique',
      location: 'Gym',
      timeAvailable: '30min',
      experience: 'Beginner',
      stance: 'Orthodox',
    },
  });

  const category = watch('category');

  const onSubmit = async (data: CoachingFormData) => {
    setIsLoading(true);
    setAiResponse('');
    setParsedResponse(null);

    try {
      // Build coaching prompt from form data
      const prompt = buildCoachingPrompt(data);

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
            category: data.category,
            formData: {
              category: data.category,
              technique: data.technique,
              techniqueFocus: data.techniqueFocus,
              tacticalScenario: data.tacticalScenario,
              trainingType: data.trainingType,
              mindsetTopic: data.mindsetTopic,
              location: data.location,
              equipment: data.equipment,
              timeAvailable: data.timeAvailable,
              experience: data.experience,
              stance: data.stance,
              question: data.question,
            },
            userProfile: {
              stance: data.stance,
              experience: data.experience,
            },
          },
        }),
      });

      if (!response.ok) {
        // Try to parse error message from JSON response
        let errorMessage = 'Failed to get coaching response';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, try to get text
          try {
            errorMessage = await response.text() || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a stream
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        // If not a stream, try to parse as JSON
        try {
          const jsonData = await response.json();
          if (jsonData.error) {
            throw new Error(jsonData.error);
          }
        } catch (e) {
          throw new Error('Unexpected response format from server');
        }
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';
      let buffer = '';
      let foundVideos: any[] = [];
      let streamComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          streamComplete = true;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              // Stream complete
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Check for tool videos (from tool calls)
              if (parsed.tool_videos && Array.isArray(parsed.tool_videos)) {
                foundVideos = [...foundVideos, ...parsed.tool_videos];
              }

              // Handle content - check multiple possible formats
              const content = parsed.choices?.[0]?.delta?.content || 
                             parsed.choices?.[0]?.message?.content ||
                             parsed.text ||
                             parsed.content ||
                             '';
              if (content) {
                fullResponse += content;
                // Update UI in real-time as content streams
                setAiResponse(fullResponse);
              }
            } catch (e) {
              // If it's not valid JSON, it might be plain text content
              // Skip lines that aren't valid JSON
            }
          } else if (line.trim() && !line.startsWith('data:')) {
            // Handle non-SSE format lines (shouldn't happen but just in case)
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('data:')) {
              fullResponse += trimmed + '\n';
              setAiResponse(fullResponse);
            }
          }
        }
      }

      // After streaming completes, ensure we have the full response
      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const content = parsed.choices?.[0]?.delta?.content || 
                         parsed.choices?.[0]?.message?.content ||
                         parsed.text ||
                         parsed.content ||
                         '';
          if (content) {
            fullResponse += content;
          }
        } catch {
          // Buffer might not be complete JSON, add as text if it looks like content
          if (buffer.trim() && !buffer.trim().startsWith('data:')) {
            fullResponse += buffer.trim();
          }
        }
      }
      
      const trimmedResponse = fullResponse.trim();
      
      // Always ensure the full response is displayed
      if (trimmedResponse) {
        setAiResponse(trimmedResponse);
      }
      
      // Only try to parse as JSON if the response looks like it contains JSON
      if (trimmedResponse.includes('{') && trimmedResponse.includes('}')) {
        // Try to find JSON object in the response (might be wrapped in markdown code blocks or plain)
        let jsonString = trimmedResponse;
        
        // Check if it's wrapped in markdown code blocks
        const codeBlockMatch = trimmedResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1];
        } else {
          // Try to find JSON object directly - get the last complete JSON object
          const jsonMatches = trimmedResponse.match(/\{[\s\S]*\}/g);
          if (jsonMatches && jsonMatches.length > 0) {
            // Use the last (most complete) JSON match
            jsonString = jsonMatches[jsonMatches.length - 1];
          }
        }
        
        try {
          const jsonResponse: CoachingResponse = JSON.parse(jsonString);
          if (jsonResponse.response) {
            setParsedResponse(jsonResponse);
            setAiResponse(jsonResponse.response);
          }
        } catch (e) {
          // If JSON parsing fails, the response might be plain text with JSON at the end
          // Try to extract just the JSON part more carefully
          const lastBraceIndex = trimmedResponse.lastIndexOf('}');
          if (lastBraceIndex > 0) {
            const potentialJson = trimmedResponse.substring(
              trimmedResponse.lastIndexOf('{', lastBraceIndex),
              lastBraceIndex + 1
            );
            try {
              const jsonResponse: CoachingResponse = JSON.parse(potentialJson);
              if (jsonResponse.response) {
                setParsedResponse(jsonResponse);
                setAiResponse(jsonResponse.response);
              }
            } catch {
              // If still not JSON, keep the raw response as-is
              // The response is already set above
            }
          }
        }
      }
      // If no JSON found, the response is already set to fullResponse above

      // Show videos from tool calls (AI searched the library)
      if (foundVideos.length > 0) {
        const video = foundVideos[0];
        setSelectedVideo({
          videoId: video.video_id,
          title: video.title,
          topic: video.topic,
          subtopic: video.subtopic,
        });
      } else {
        // Fallback: extract video references from text
        const videoRefs = extractVideoReferences(fullResponse);
        if (videoRefs.length > 0) {
          // Fetch video details by ID
          const videoRes = await fetch(`/api/videos/${videoRefs[0].videoId}`);
          if (videoRes.ok) {
            const videoData = await videoRes.json();
            if (videoData.video) {
              setSelectedVideo({
                videoId: videoData.video.video_id,
                title: videoData.video.video_title,
                topic: videoData.video.topic,
                subtopic: videoData.video.subtopic,
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Coaching error:', error);
      setAiResponse(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCoachingPrompt = (data: CoachingFormData): string => {
    let prompt = `I need personalized boxing coaching from Matt Goddard. Here are my details:\n\n`;

    // Category and specific focus
    prompt += `**What I want to work on:** ${data.category}\n`;
    
    if (data.category === 'Technique') {
      if (data.technique && data.techniqueFocus) {
        prompt += `- Specific technique: ${data.technique}\n`;
        prompt += `- Focus area: ${data.techniqueFocus}\n`;
      } else {
        prompt += `- I haven't specified a particular technique yet, but I want to work on ${data.category.toLowerCase()}.\n`;
        prompt += `- Please help me understand what techniques would be most beneficial for my level.\n`;
      }
    } else if (data.category === 'Tactics') {
      if (data.tacticalScenario) {
        prompt += `- Tactical scenario: ${data.tacticalScenario}\n`;
      } else {
        prompt += `- I want to improve my tactical understanding but haven't specified a particular scenario yet.\n`;
      }
    } else if (data.category === 'Training') {
      if (data.trainingType) {
        prompt += `- Training type: ${data.trainingType}\n`;
      } else {
        prompt += `- I want training guidance but haven't specified a particular type yet.\n`;
      }
    } else if (data.category === 'Mindset') {
      if (data.mindsetTopic) {
        prompt += `- Mindset topic: ${data.mindsetTopic}\n`;
      } else {
        prompt += `- I want to work on my mindset but haven't specified a particular topic yet.\n`;
      }
    }

    // User profile
    prompt += `\n**My profile:**\n`;
    prompt += `- Experience level: ${data.experience || 'Not specified'}\n`;
    prompt += `- Stance: ${data.stance || 'Not specified'}\n`;
    prompt += `- Training location: ${data.location || 'Not specified'}\n`;
    prompt += `- Time available: ${data.timeAvailable || 'Not specified'}\n`;

    // Equipment if specified
    if (data.equipment && data.equipment.length > 0) {
      prompt += `- Equipment available: ${data.equipment.join(', ')}\n`;
    }

    // Specific question if provided
    if (data.question) {
      prompt += `\n**My specific question:** ${data.question}\n`;
    }

    prompt += `\nPlease provide comprehensive, personalized coaching based on ALL this information. `;
    prompt += `If I haven't specified a particular technique/topic, please suggest the most important areas for my experience level (${data.experience}) and provide specific guidance. `;
    prompt += `Include specific drills, techniques, and video recommendations that match my experience level and available time (${data.timeAvailable}). `;
    prompt += `Consider my stance (${data.stance}) when giving technique advice.`;

    return prompt;
  };

  const extractVideoReferences = (text: string): Array<{ videoId: string; timestamp?: number }> => {
    const pattern = /\[([a-zA-Z0-9_-]{11})\](?:\s*at\s*(\d+))?/gi;
    const matches = [...text.matchAll(pattern)];
    return matches.map(match => ({
      videoId: match[1],
      timestamp: match[2] ? parseInt(match[2]) : undefined,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((p) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                phase >= p
                  ? 'bg-boxing-red text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {p}
            </div>
            {p < 3 && (
              <div
                className={`h-1 w-8 sm:w-12 ${
                  phase > p ? 'bg-boxing-red' : 'bg-gray-800'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phase 1: Category Selection */}
        {phase === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">What do you want to work on?</CardTitle>
              <CardDescription>Select the main area you'd like coaching on</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={category}
                onValueChange={(value) => setValue('category', value as Category)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
                  <TabsTrigger value="Technique">Technique</TabsTrigger>
                  <TabsTrigger value="Tactics">Tactics</TabsTrigger>
                  <TabsTrigger value="Training">Training</TabsTrigger>
                  <TabsTrigger value="Mindset">Mindset</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhase(2)}
                  className="flex-1"
                >
                  Next: Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase 2: Granular Details */}
        {phase === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Tell me more</CardTitle>
              <CardDescription>Provide specific details about what you want to learn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {category === 'Technique' && (
                <>
                  <div className="space-y-2">
                    <Label>Which technique?</Label>
                    <Select
                      value={watch('technique')}
                      onValueChange={(value) => setValue('technique', value as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select technique" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Jab">Jab</SelectItem>
                        <SelectItem value="Cross">Cross</SelectItem>
                        <SelectItem value="Hook">Hook</SelectItem>
                        <SelectItem value="Uppercut">Uppercut</SelectItem>
                        <SelectItem value="Footwork">Footwork</SelectItem>
                        <SelectItem value="Defense">Defense</SelectItem>
                        <SelectItem value="Guard">Guard</SelectItem>
                        <SelectItem value="Stance">Stance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>What's your focus?</Label>
                    <Select
                      value={watch('techniqueFocus')}
                      onValueChange={(value) => setValue('techniqueFocus', value as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select focus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Power">Power</SelectItem>
                        <SelectItem value="Speed">Speed</SelectItem>
                        <SelectItem value="Form">Form</SelectItem>
                        <SelectItem value="Range">Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {category === 'Tactics' && (
                <div className="space-y-2">
                  <Label>Tactical scenario</Label>
                  <Select
                    value={watch('tacticalScenario')}
                    onValueChange={(value) => setValue('tacticalScenario', value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Combination">Combinations</SelectItem>
                      <SelectItem value="Distance">Distance Management</SelectItem>
                      <SelectItem value="Counter">Counter-punching</SelectItem>
                      <SelectItem value="Angle">Angles & Positioning</SelectItem>
                      <SelectItem value="Timing">Timing & Rhythm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {category === 'Training' && (
                <div className="space-y-2">
                  <Label>Training type</Label>
                  <Select
                    value={watch('trainingType')}
                    onValueChange={(value) => setValue('trainingType', value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Drill">Drills</SelectItem>
                      <SelectItem value="Workout">Workout Routine</SelectItem>
                      <SelectItem value="Conditioning">Conditioning</SelectItem>
                      <SelectItem value="Sparring">Sparring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {category === 'Mindset' && (
                <div className="space-y-2">
                  <Label>Mindset topic</Label>
                  <Select
                    value={watch('mindsetTopic')}
                    onValueChange={(value) => setValue('mindsetTopic', value as any)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Confidence">Confidence</SelectItem>
                      <SelectItem value="Focus">Focus & Concentration</SelectItem>
                      <SelectItem value="Discipline">Discipline</SelectItem>
                      <SelectItem value="Motivation">Motivation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhase(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setPhase(3)}
                  className="flex-1"
                >
                  Next: Context
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase 3: Context & Submit */}
        {phase === 3 && (
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

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPhase(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
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
        )}
      </form>

      {/* AI Response */}
      {aiResponse && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-champion-gold" />
              Matt's Coaching
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Response Text */}
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {parsedResponse?.response || aiResponse}
            </div>

            {/* Suggested Actions */}
            {parsedResponse?.suggested_actions && parsedResponse.suggested_actions.length > 0 && (
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
                  Suggested Next Steps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parsedResponse.suggested_actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start text-left h-auto py-3 px-4 hover:bg-gray-800 hover:border-boxing-red transition-colors"
                      onClick={() => {
                        // Handle action click - could trigger a new query or navigate
                        if (action.action === 'watch_video' && action.video_id) {
                          setSelectedVideo({
                            videoId: action.video_id,
                            title: action.label,
                          });
                          setIsPlayerOpen(true);
                        } else {
                          // For explore_topic or ask_question, could pre-fill the form or show in chat
                          setAiResponse(`Follow-up: ${action.value}\n\n${aiResponse}`);
                        }
                      }}
                    >
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
                        setIsPlayerOpen(true);
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
                  onClick={() => setIsPlayerOpen(true)}
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

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          topic={selectedVideo.topic}
          subtopic={selectedVideo.subtopic}
          open={isPlayerOpen}
          onOpenChange={setIsPlayerOpen}
        />
      )}
    </div>
  );
}

