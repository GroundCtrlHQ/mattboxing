'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoPlayer } from './VideoPlayer';
import { StreamdownMarkdown } from './StreamdownMarkdown';
import { Loader2, Sparkles, Download, Play, CheckCircle2, User, Target, Clock, MapPin, Heart, Calendar, Mail, ExternalLink, ArrowLeft } from 'lucide-react';
import { generateCoachingPlanPDF } from './CoachingPlanPDF';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

export interface CoachingFormData {
  location?: 'Gym' | 'Home';
  timeAvailable?: '15min' | '30min' | '45min' | '60min';
  experience?: 'Beginner' | 'Intermediate' | 'Advanced';
  stance?: 'Orthodox' | 'Southpaw' | 'Switch';
}

export interface CoachingResponse {
  response: string;
  video_recommendations?: Array<{
    video_id: string;
    title: string;
    reason?: string;
  }>;
}

type Step = 'form' | 'coaching' | 'about' | 'download';

// About Matt Goddard - from research
const MATT_GODDARD_INFO = {
  name: 'Matt Goddard',
  title: '"The Boxing Locker"',
  credentials: [
    '7-0 Undefeated Professional Boxer',
    'Amateur National Champion',
    '20+ Years Boxing Experience',
    '10+ Years Personal Training',
    '300k+ Instagram Followers',
    '50k+ TikTok Followers',
  ],
  story: `Started boxing at 11 years old under legendary British Boxing coach Trevor Francis at Basingstoke Amateur Boxing Club. Won a national title, numerous victories, and had incredible experiences before turning professional in 2011.

Went undefeated in 7 professional fights before medical circumstances (eye issues) forced retirement. But that marked the beginning of his coaching career.

Now runs The Boxing Locker gym in Hook, Hampshire, and has built a massive online following sharing authentic boxing knowledge. Featured on BBC Radio Surrey, The Basingstoke Gazette, and BBC Radio Berkshire.`,
  philosophy: `Every fiber of my being is dedicated to health, fitness, and the art of boxing. With the wealth of knowledge and experience I've accumulated, I am here to empower you in achieving your goals, no matter how audacious they may seem.`,
};

// Videos about Matt
const MATT_VIDEOS = [
  {
    video_id: 'cI8vK6Wl8yI', // Replace with actual video about Matt
    title: 'Meet Matt Goddard - The Boxing Locker',
    description: 'Learn about Matt\'s journey from amateur champion to professional boxer',
  },
  {
    video_id: 'R0U7mY-h6fU', // Replace with actual video
    title: 'Training Philosophy with Matt',
    description: 'Matt shares his approach to boxing training and coaching',
  },
];

// 7-Day 30-Minute Training Plan
const SEVEN_DAY_PLAN = [
  { day: 'Day 1', focus: 'Stance & Jab', duration: '30 min', description: 'Master your boxing stance and perfect the jab technique' },
  { day: 'Day 2', focus: 'Footwork & Movement', duration: '30 min', description: 'Develop agility and learn to move in the ring' },
  { day: 'Day 3', focus: 'Defense & Guard', duration: '30 min', description: 'Build your defensive skills and protect yourself' },
  { day: 'Day 4', focus: 'Combinations', duration: '30 min', description: 'Learn basic punch combinations and flow' },
  { day: 'Day 5', focus: 'Power & Cross', duration: '30 min', description: 'Develop power in your rear hand cross' },
  { day: 'Day 6', focus: 'Conditioning', duration: '30 min', description: 'Build endurance and boxing-specific fitness' },
  { day: 'Day 7', focus: 'Review & Sparring Prep', duration: '30 min', description: 'Review all techniques and prepare for live work' },
];

export function LeadMagnetCoach() {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [loadingStage, setLoadingStage] = useState<'analyzing' | 'searching_videos' | 'generating' | 'finalizing'>('analyzing');
  const [parsedResponse, setParsedResponse] = useState<CoachingResponse | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ videoId: string; title: string; topic?: string; subtopic?: string } | null>(null);
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [formData, setFormData] = useState<CoachingFormData | null>(null);
  const [toolVideos, setToolVideos] = useState<Array<{ video_id: string; title: string; topic?: string; subtopic?: string }>>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CoachingFormData>({
    defaultValues: {
      location: 'Gym',
      timeAvailable: '30min',
      experience: 'Beginner',
      stance: 'Orthodox',
    },
  });

  // Parse coaching response
  function parseCoachingResponse(parts: any[]): { text: string; response: CoachingResponse | null } {
    if (!parts) return { text: '', response: null };

    const rawText = parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    let response: CoachingResponse | null = null;
    let cleanText = rawText;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.response) {
          response = {
            response: parsed.response,
            video_recommendations: parsed.video_recommendations || [],
          };
        }
        cleanText = rawText.replace(/```json[\s\S]*?```/, '').trim();
      } catch (e) {
        console.error('[Coach] Failed to parse JSON:', e);
      }
    }

    return { text: cleanText, response };
  }

  const onSubmit = async (data: CoachingFormData) => {
    setFormData(data);
    setIsLoadingManual(true);
    setLoadingStage('analyzing');
    setParsedResponse(null);
    setMessages([]);
    setCurrentStep('coaching');

    try {
      const prompt = `I'm a ${data.experience || 'Beginner'} boxer with an ${data.stance || 'Orthodox'} stance. I train at ${data.location || 'Gym'} and have ${data.timeAvailable || '30 minutes'} available. Please provide personalised coaching based on my needs.`;

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
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

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim().startsWith(': OPENROUTER')) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]' || data === '') continue;

            try {
              const parsed = JSON.parse(data);
              
              // Capture videos from tool results
              if (parsed.type === 'tool-output-available' && parsed.output) {
                const output = parsed.output;
                if (output.type === 'video_selections' && Array.isArray(output.videos)) {
                  const videos = output.videos.map((v: any) => ({
                    video_id: v.video_id,
                    title: v.title,
                    topic: v.topic,
                    subtopic: v.subtopic,
                  }));
                  setToolVideos(videos);
                  console.log('[LeadMagnet] Found videos from tool:', videos);
                }
              }
              
              if (parsed.type === 'text-delta') {
                const delta = parsed.delta || parsed.textDelta || '';
                if (delta) {
                  fullResponse += delta;
                  setMessages([{
                    id: '1',
                    role: 'assistant',
                    parts: [{ type: 'text', text: fullResponse }],
                    createdAt: new Date().toISOString(),
                  }]);
                }
              }
              if (parsed.type === 'tool-input-start') setLoadingStage('searching_videos');
              if (parsed.type === 'text-delta' || parsed.type === 'text') setLoadingStage('generating');
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      if (fullResponse) {
        setMessages([{
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: fullResponse }],
          createdAt: new Date().toISOString(),
        }]);
      }

      const { response: parsedResponse } = parseCoachingResponse([{ type: 'text', text: fullResponse }]);
      if (parsedResponse) {
        // If no video recommendations in JSON but we have tool videos, use them
        if (!parsedResponse.video_recommendations || parsedResponse.video_recommendations.length === 0) {
          if (toolVideos.length > 0) {
            parsedResponse.video_recommendations = toolVideos.map(v => ({
              video_id: v.video_id,
              title: v.title,
              reason: `Recommended training video for ${v.subtopic || v.topic || 'boxing technique'}`,
            }));
            console.log('[LeadMagnet] Using tool videos as recommendations:', parsedResponse.video_recommendations);
          }
        }
        setParsedResponse(parsedResponse);
        setLoadingStage('finalizing');
        // Auto-advance to about step after a delay
        setTimeout(() => setCurrentStep('about'), 2000);
      } else if (toolVideos.length > 0) {
        // If parsing failed but we have tool videos, create a response with them
        setParsedResponse({
          response: fullResponse,
          video_recommendations: toolVideos.map(v => ({
            video_id: v.video_id,
            title: v.title,
            reason: `Recommended training video`,
          })),
        });
        setLoadingStage('finalizing');
        setTimeout(() => setCurrentStep('about'), 2000);
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

  // Navigate to previous step
  const handleBack = () => {
    switch (currentStep) {
      case 'coaching':
        setCurrentStep('form');
        break;
      case 'about':
        setCurrentStep('coaching');
        break;
      case 'download':
        setCurrentStep('about');
        break;
      default:
        break;
    }
  };

  // Download summary as PDF
  const handleDownload = () => {
    if (!parsedResponse || !formData) return;
    generateCoachingPlanPDF(parsedResponse, formData);
  };

  // Calculate progress
  const getProgress = () => {
    switch (currentStep) {
      case 'form': return 25;
      case 'coaching': return 50;
      case 'about': return 75;
      case 'download': return 100;
      default: return 0;
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'form': return 1;
      case 'coaching': return 2;
      case 'about': return 3;
      case 'download': return 4;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Progress Indicator */}
      {currentStep !== 'form' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Step {getStepNumber()} of 4</span>
                <span className="text-gray-400">{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Form */}
      {currentStep === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-champion-gold" />
              Get Your Free Personalised Boxing Coaching Plan
            </CardTitle>
            <CardDescription className="text-base">
              Answer a few quick questions and get a customized training plan from Matt Goddard, 7-0 professional boxer and National Champion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Experience Level
                  </Label>
                  <Select
                    value={watch('experience')}
                    onValueChange={(value) => setValue('experience', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stance" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Your Stance
                  </Label>
                  <Select
                    value={watch('stance')}
                    onValueChange={(value) => setValue('stance', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orthodox">Orthodox</SelectItem>
                      <SelectItem value="Southpaw">Southpaw</SelectItem>
                      <SelectItem value="Switch">Switch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Where Do You Train?
                  </Label>
                  <Select
                    value={watch('location')}
                    onValueChange={(value) => setValue('location', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gym">Gym</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeAvailable" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Available
                  </Label>
                  <Select
                    value={watch('timeAvailable')}
                    onValueChange={(value) => setValue('timeAvailable', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">15 minutes</SelectItem>
                      <SelectItem value="30min">30 minutes</SelectItem>
                      <SelectItem value="45min">45 minutes</SelectItem>
                      <SelectItem value="60min">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoadingManual}
                className="w-full"
                size="lg"
              >
                {isLoadingManual ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get My Free Coaching Plan
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Coaching Response */}
      {currentStep === 'coaching' && (
        <>
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Form
            </Button>
          </div>
          {/* 7-Day Plan Cards */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-champion-gold" />
                7-Day 30-Minute Training Plan
              </CardTitle>
              <CardDescription>
                A complete week of structured boxing training - perfect for beginners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
                {SEVEN_DAY_PLAN.map((day, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-boxing-red/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {day.day}
                      </Badge>
                      <span className="text-xs text-gray-400">{day.duration}</span>
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">{day.focus}</h4>
                    <p className="text-gray-400 text-xs">{day.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cardio Importance - Accordion */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-boxing-red" />
                Why Cardio Matters in Boxing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cardio-basics" className="border-gray-800">
                  <AccordionTrigger className="text-white hover:no-underline">
                    The Foundation: Why Cardio is Essential
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-invert max-w-none text-gray-300">
                      <p className="leading-relaxed">
                        Cardio isn't just about running longer—it's about <strong>lasting in the ring</strong>. 
                        Boxing demands explosive bursts of energy followed by quick recovery. Your cardiovascular 
                        fitness directly impacts your ability to:
                      </p>
                      <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
                        <li>Maintain power and speed throughout rounds</li>
                        <li>Recover quickly between combinations</li>
                        <li>Keep your guard up when you're tired</li>
                        <li>Think clearly under pressure</li>
                        <li>Execute techniques correctly when fatigued</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="cardio-practical" className="border-gray-800">
                  <AccordionTrigger className="text-white hover:no-underline">
                    Practical Cardio Training Tips
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-invert max-w-none text-gray-300">
                      <p className="leading-relaxed">
                        Even 15-20 minutes of focused cardio work 3-4 times per week will dramatically improve 
                        your boxing performance. Mix running, skipping, and bag work to build that engine.
                      </p>
                      <Separator className="my-4 bg-gray-800" />
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold text-white">Best Cardio for Boxers:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                          <li>Jump rope (3-5 rounds, 2-3 min each)</li>
                          <li>Interval running (30 sec sprint, 90 sec jog)</li>
                          <li>Heavy bag rounds (3 min work, 1 min rest)</li>
                          <li>Shadow boxing with footwork (5-10 min continuous)</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Coaching Response */}
          {isLoadingManual && messages.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <Loader2 className="w-12 h-12 animate-spin text-boxing-red" />
                  <div className="text-center space-y-4 w-full max-w-md">
                    <h3 className="text-lg font-semibold text-white">
                      {loadingStage === 'analyzing' && 'Analyzing your needs...'}
                      {loadingStage === 'searching_videos' && 'Finding perfect videos...'}
                      {loadingStage === 'generating' && 'Creating your plan...'}
                      {loadingStage === 'finalizing' && 'Finalizing...'}
                    </h3>
                    <Progress 
                      value={
                        loadingStage === 'analyzing' ? 25 :
                        loadingStage === 'searching_videos' ? 50 :
                        loadingStage === 'generating' ? 75 : 100
                      } 
                      className="h-2"
                    />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-champion-gold" />
                  Your Personalised Coaching Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                  {(() => {
                    const assistantMessage = messages[messages.length - 1];
                    if (!assistantMessage) return null;
                    const { text, response } = parseCoachingResponse(assistantMessage.parts);
                    if (response && !parsedResponse) setParsedResponse(response);
                    return <StreamdownMarkdown content={parsedResponse?.response || text || 'No response received'} />;
                  })()}
                </div>

                {/* Video Recommendations */}
                {parsedResponse?.video_recommendations && parsedResponse.video_recommendations.length > 0 && (
                  <div className="pt-4 border-t border-gray-800">
                    <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
                      Recommended Training Videos
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
                          <Button variant="ghost" size="sm" className="shrink-0">
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800">
                  <Button
                    onClick={() => setCurrentStep('about')}
                    className="w-full"
                    variant="outline"
                  >
                    Continue to Learn About Your Coach →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Step 3: About Matt */}
      {currentStep === 'about' && (
        <>
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Coaching Plan
            </Button>
          </div>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-champion-gold" />
              Meet Your Coach: {MATT_GODDARD_INFO.name}
            </CardTitle>
            <CardDescription>{MATT_GODDARD_INFO.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {MATT_GODDARD_INFO.credentials.map((cred, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {cred}
                </Badge>
              ))}
            </div>

            <div className="prose prose-invert max-w-none text-gray-300">
              <h3 className="text-white font-semibold mb-2">The Story</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {MATT_GODDARD_INFO.story}
              </p>

              <h3 className="text-white font-semibold mt-6 mb-2">The Philosophy</h3>
              <p className="text-gray-300 leading-relaxed italic">
                "{MATT_GODDARD_INFO.philosophy}"
              </p>
            </div>

            {/* Videos About Matt */}
            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
                Learn More About Matt
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MATT_VIDEOS.map((video, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedVideo({
                        videoId: video.video_id,
                        title: video.title,
                      });
                    }}
                  >
                    <p className="text-white font-medium text-sm mb-1">{video.title}</p>
                    <p className="text-gray-400 text-xs">{video.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <Button
                onClick={() => setCurrentStep('download')}
                className="w-full"
                variant="outline"
              >
                Download Your Plan →
              </Button>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Step 4: Download */}
      {currentStep === 'download' && (
        <>
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to About Matt
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-champion-gold" />
                Download Your Coaching Plan
              </CardTitle>
              <CardDescription>
                Save your personalised plan and start training today
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-boxing-red/20 mb-4">
                  <Download className="h-8 w-8 text-boxing-red" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Your Plan is Ready!
                </h3>
                <p className="text-gray-400 mb-6">
                  Download your personalised coaching plan and keep it handy for your training sessions.
                </p>
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Coaching Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Reach Out Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-champion-gold" />
                Ready to Take Your Training to the Next Level?
              </CardTitle>
              <CardDescription>
                Join Matt in person or online for personalised coaching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-invert max-w-none text-gray-300">
                <p className="leading-relaxed mb-4">
                  This free plan is just the beginning. When you're ready to take your boxing to the next level, 
                  Matt offers personalised coaching both in-person and online.
                </p>
              </div>

              {/* Gym Location */}
              <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-boxing-red mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">The Boxing Locker</h4>
                    <p className="text-gray-300 text-sm">
                      Unit K, Bunker's Hill Farm<br />
                      Hook, United Kingdom<br />
                      RG27 9DA
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      5 min from Hook Village • 10 min from Odiham • 20 min from Basingstoke
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="justify-start h-auto py-4"
                >
                  <a href="https://www.tbltrainingplans.com/" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-semibold">TBL Training Plans</div>
                        <div className="text-xs text-gray-400">Online resources & programs</div>
                      </div>
                    </div>
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="justify-start h-auto py-4"
                >
                  <a href="https://TheBoxingLockerClasses.as.me/" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-semibold">Book Classes & PT</div>
                        <div className="text-xs text-gray-400">In-person training sessions</div>
                      </div>
                    </div>
                  </a>
                </Button>
              </div>

              {/* Class Highlights - Accordion */}
              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Available Classes & Timetable
                </h4>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="classes" className="border-gray-800">
                    <AccordionTrigger className="text-white hover:no-underline">
                      View All Classes & Weekly Schedule
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-boxing-red shrink-0" />
                          <span>Women's BoxFit (45 min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-boxing-red shrink-0" />
                          <span>Mixed BoxFit (45 min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-boxing-red shrink-0" />
                          <span>Boxing Club 16+ (90 min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-boxing-red shrink-0" />
                          <span>ShredStrong (45 min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-boxing-red shrink-0" />
                          <span>Personal Training (45 min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-boxing-red shrink-0" />
                          <span>Juniors Boxing (monthly)</span>
                        </div>
                      </div>
                      <Separator className="my-4 bg-gray-800" />
                      <div className="text-xs text-gray-400 space-y-1">
                        <p className="font-semibold text-gray-300 mb-2">Weekly Schedule Highlights:</p>
                        <p><strong>Monday:</strong> Women's BoxFit 9:00, Boxing Club 18:00, Mixed BoxFit 19:30</p>
                        <p><strong>Tuesday:</strong> ShredStrong 9:00</p>
                        <p><strong>Wednesday:</strong> Boxing Club 18:00, Mixed BoxFit 19:30</p>
                        <p><strong>Thursday:</strong> ShredStrong 9:00, Mixed BoxFit 18:00</p>
                        <p><strong>Friday:</strong> Women's BoxFit 9:00</p>
                        <p><strong>Saturday:</strong> Mixed BoxFit 7:30 & 8:15, Boxing Club (sparring) 9:00</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <p className="text-xs text-gray-400 mt-3">
                  All sessions suitable for any level. Book at:{' '}
                  <a href="https://TheBoxingLockerClasses.as.me/" target="_blank" rel="noopener noreferrer" className="text-boxing-red hover:underline">
                    TheBoxingLockerClasses.as.me
                  </a>
                </p>
              </div>

              {/* Contact Info */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <Mail className="h-4 w-4 text-boxing-red" />
                  <a href="mailto:matt@theboxinglocker.com" className="hover:text-white hover:underline">
                    matt@theboxinglocker.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          topic={selectedVideo.topic}
          subtopic={selectedVideo.subtopic}
          open={!!selectedVideo}
          onOpenChange={(open) => {
            if (!open) setSelectedVideo(null);
          }}
        />
      )}
    </div>
  );
}

