'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Loader2, MessageSquare, Video, Sparkles, Clock, Play, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoPlayer } from './VideoPlayer';

interface ChatBotProps {
  sessionId: string;
  initialCategory?: 'Technique' | 'Tactics' | 'Training' | 'Mindset';
}

// Types for tool outputs
interface VideoResult {
  video_id: string;
  title: string;
  topic?: string;
  subtopic?: string;
  reason?: string;
  url?: string;
}

interface SuggestedAction {
  label: string;
  action: 'ask_question' | 'watch_video' | 'explore_topic' | 'take_quiz';
  value: string;
  video_id?: string;
}

interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Quiz {
  question: string;
  options: QuizOption[];
  explanation: string;
}

// Format timestamp for display
function formatTimestamp(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

// Extract text and JSON from message parts
function parseTextAndJson(parts: any[]): {
  text: string;
  actions: SuggestedAction[];
  quiz: Quiz | null;
  videoSearchTerms: string[];
} {
  if (!parts) return { text: '', actions: [], quiz: null, videoSearchTerms: [] };
  
  const rawText = parts
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('');
  
  // Try to extract JSON block from the end of the response
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
  
  let actions: SuggestedAction[] = [];
  let quiz: Quiz | null = null;
  let videoSearchTerms: string[] = [];
  let cleanText = rawText;
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      
      // Parse actions
      if (parsed.actions && Array.isArray(parsed.actions)) {
        actions = parsed.actions.map((a: any) => ({
          label: a.label || '',
          action: a.type || 'explore_topic',
          value: a.query || a.label,
          video_id: a.video_id,
        }));
      }
      
      // Parse video search terms
      if (parsed.videos && Array.isArray(parsed.videos)) {
        videoSearchTerms = parsed.videos;
      }
      
      // Parse quiz
      if (parsed.quiz && parsed.quiz.question) {
        quiz = {
          question: parsed.quiz.question,
          options: (parsed.quiz.options || []).map((o: any) => ({
            id: o.id || 'A',
            text: o.text || '',
            is_correct: o.is_correct || false,
          })),
          explanation: parsed.quiz.explanation || '',
        };
      }
      
      // Remove JSON block from displayed text
      cleanText = rawText.replace(/```json[\s\S]*?```/, '').trim();
    } catch (e) {
      console.log('[v0] Failed to parse JSON from response:', e);
    }
  }
  
  return { text: cleanText, actions, quiz, videoSearchTerms };
}

// Extract tool outputs from message parts
function getToolOutputs(parts: any[]): {
  videos: VideoResult[];
  actions: SuggestedAction[];
  quiz: Quiz | null;
} {
  const result = {
    videos: [] as VideoResult[],
    actions: [] as SuggestedAction[],
    quiz: null as Quiz | null,
  };
  
  if (!parts) return result;
  
  for (const part of parts) {
    // Check for tool invocation with output
    if (part.type === 'tool-invocation' && part.state === 'result' && part.result) {
      const output = part.result;
      
      if (output.type === 'video_selections' && output.videos) {
        result.videos.push(...output.videos);
      }
      else if (output.type === 'suggested_actions' && output.actions) {
        result.actions.push(...output.actions);
      }
      else if (output.type === 'quiz') {
        result.quiz = {
          question: output.question,
          options: output.options,
          explanation: output.explanation,
        };
      }
    }
  }
  
  return result;
}

export function ChatBot({ sessionId, initialCategory }: ChatBotProps) {
  const [selectedVideo, setSelectedVideo] = useState<{
    videoId: string;
    title: string;
    startTime?: number;
  } | null>(null);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [revealedQuizzes, setRevealedQuizzes] = useState<Set<string>>(new Set());
  const [messageVideos, setMessageVideos] = useState<Record<string, VideoResult[]>>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Local input state as fallback
  const [localInput, setLocalInput] = useState('');

  // Use the AI SDK useChat hook
  const chatHook = useChat({
    id: sessionId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { sessionId },
    }),
  });

  const { messages, input, sendMessage, status, error, setMessages } = chatHook;
  
  // Use setInput from hook if available, otherwise use local state
  const setInput = (chatHook as any).setInput || setLocalInput;
  const inputValue = input !== undefined ? input : localInput;

  // Load chat history when session changes and update messages
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch(`/api/chat?sessionId=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            // Update messages in the chat hook
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId, setMessages]);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch videos for messages that have video search terms
  useEffect(() => {
    const fetchVideosForMessages = async () => {
      for (const msg of messages) {
        if (msg.role !== 'assistant') continue;
        if (messageVideos[msg.id]) continue; // Already fetched
        
        const parsed = parseTextAndJson(msg.parts);
        if (parsed.videoSearchTerms.length === 0) continue;
        
        // Fetch videos for the search terms
        const query = parsed.videoSearchTerms.join(' ');
        try {
          const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}&limit=3`);
          if (response.ok) {
            const data = await response.json();
            setMessageVideos(prev => ({
              ...prev,
              [msg.id]: data.videos || [],
            }));
          }
        } catch (e) {
          console.error('[v0] Failed to fetch videos:', e);
        }
      }
    };
    
    fetchVideosForMessages();
  }, [messages, messageVideos]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const textValue = inputValue || '';
    if (textValue.trim() && !isLoading) {
      sendMessage({ parts: [{ type: 'text', text: textValue }] });
      setInput('');
      setLocalInput('');
    }
  };

  // Handle quick action buttons
  const handleQuickAction = (query: string) => {
    if (!isLoading) {
      sendMessage({ parts: [{ type: 'text', text: query }] });
    }
  };

  // Handle suggested action click
  const handleActionClick = (action: SuggestedAction) => {
    if (action.action === 'watch_video' && action.video_id) {
      setSelectedVideo({
        videoId: action.video_id,
        title: action.label,
      });
    } else {
      handleQuickAction(action.value);
    }
  };

  // Handle video selection click
  const handleVideoSelect = (video: VideoResult) => {
    if (!video.video_id) {
      console.error('[v0] Video missing video_id:', video);
      return;
    }
    console.log('[v0] Opening video:', video.video_id, video.title);
    setSelectedVideo({
      videoId: video.video_id,
      title: video.title || 'Video',
    });
  };

  // Handle quiz answer
  const handleQuizAnswer = (msgId: string, optionId: string) => {
    setQuizAnswers(prev => ({ ...prev, [msgId]: optionId }));
    setRevealedQuizzes(prev => new Set([...prev, msgId]));
  };

  return (
    <div className="flex flex-col h-full bg-charcoal overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingHistory && (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-boxing-red" />
              <span className="text-sm text-gray-400">Loading chat history...</span>
            </div>
          </div>
        )}
        {!isLoadingHistory && messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-boxing-red opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">Chat with Matt</h3>
            <p className="text-gray-400 text-sm mb-6">
              Ask me anything about boxing technique, tactics, training, or mindset.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("How do I improve my jab?")}
                className="text-xs border-boxing-red/30 text-boxing-red hover:bg-boxing-red/10"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Improve my jab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("What's the best footwork drill?")}
                className="text-xs border-boxing-red/30 text-boxing-red hover:bg-boxing-red/10"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Footwork drills
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("Show me knockout combinations")}
                className="text-xs border-boxing-red/30 text-boxing-red hover:bg-boxing-red/10"
              >
                <Video className="w-3 h-3 mr-1" />
                Knockout combos
              </Button>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          // Parse text and JSON from assistant messages
          const parsed = msg.role === 'assistant' 
            ? parseTextAndJson(msg.parts) 
            : { text: msg.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '', actions: [], quiz: null, videoSearchTerms: [] };
          
          // Get video results from tool calls (fallback)
          const toolOutputs = msg.role === 'assistant' ? getToolOutputs(msg.parts) : { videos: [], actions: [], quiz: null };
          
          // Combine: text from parsed, videos from messageVideos or tools, actions/quiz from parsed JSON
          const textContent = parsed.text;
          const videos = messageVideos[msg.id] || toolOutputs.videos;
          const actions = parsed.actions.length > 0 ? parsed.actions : toolOutputs.actions;
          const quiz = parsed.quiz || toolOutputs.quiz;
          
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-boxing-red text-white'
                    : 'bg-gray-800 text-gray-100'
                } rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}
              >
                {/* Main response text */}
                {textContent && (
                  <div className="text-sm sm:text-base whitespace-pre-wrap break-words">
                    {textContent}
                  </div>
                )}

                {/* Video Selections (from tool output) */}
                {videos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Select a video to watch:
                    </p>
                    <div className="grid gap-2">
                      {videos.map((video, vIdx) => (
                        <button
                          key={vIdx}
                          onClick={() => handleVideoSelect(video)}
                          className="w-full bg-black/30 rounded-lg p-3 text-left hover:bg-black/50 transition-colors border border-transparent hover:border-boxing-red/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-boxing-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Play className="w-5 h-5 text-boxing-red" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {video.title}
                              </p>
                              {video.reason && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {video.reason}
                                </p>
                              )}
                              {video.subtopic && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {video.topic} • {video.subtopic}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quiz Section (from JSON or tool output) */}
                {quiz && (
                  <div className="mt-4 bg-black/20 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4 text-champion-gold" />
                      <p className="text-sm font-semibold text-champion-gold">Quick Quiz</p>
                    </div>
                    <p className="text-sm text-white mb-3">{quiz.question}</p>
                    <div className="space-y-2">
                      {quiz.options.map((option) => {
                        const isRevealed = revealedQuizzes.has(msg.id);
                        const isSelected = quizAnswers[msg.id] === option.id;
                        const isCorrect = option.is_correct;
                        
                        return (
                          <button
                            key={option.id}
                            onClick={() => !isRevealed && handleQuizAnswer(msg.id, option.id)}
                            disabled={isRevealed}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center gap-2 ${
                              isRevealed
                                ? isCorrect
                                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                  : isSelected
                                    ? 'bg-red-500/20 border-red-500/50 text-red-300'
                                    : 'bg-gray-700/50 text-gray-400'
                                : 'bg-gray-700/50 hover:bg-gray-700 text-white border border-transparent hover:border-gray-600'
                            } ${isRevealed ? 'border' : ''}`}
                          >
                            <span className="font-semibold">{option.id}.</span>
                            <span className="flex-1">{option.text}</span>
                            {isRevealed && isCorrect && <CheckCircle className="w-4 h-4 text-green-400" />}
                            {isRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                          </button>
                        );
                      })}
                    </div>
                    {revealedQuizzes.has(msg.id) && quiz.explanation && (
                      <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                        <p className="text-xs text-gray-300">
                          <span className="font-semibold">Explanation:</span> {quiz.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Actions (Pill Buttons from JSON or tool output) */}
                {actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleActionClick(action)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-boxing-red/20 hover:bg-boxing-red/30 text-boxing-red border border-boxing-red/30 transition-colors disabled:opacity-50"
                      >
                        {action.action === 'watch_video' && <Play className="w-3 h-3" />}
                        {action.action === 'explore_topic' && <Sparkles className="w-3 h-3" />}
                        {action.action === 'take_quiz' && <HelpCircle className="w-3 h-3" />}
                        {action.action === 'ask_question' && <MessageSquare className="w-3 h-3" />}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`flex items-center gap-1 mt-3 text-xs ${
                  msg.role === 'user' ? 'text-white/60' : 'text-gray-500'
                }`}>
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-boxing-red" />
                <span className="text-sm text-gray-400">Matt is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-2">
              <p className="text-sm text-red-400">Error: {error.message}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue || ''}
            onChange={(e) => {
              setInput(e.target.value);
              setLocalInput(e.target.value);
            }}
            placeholder="Ask Matt anything..."
            disabled={isLoading}
            className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-boxing-red"
          />
          <Button
            type="submit"
            disabled={isLoading || !(inputValue || '').trim()}
            className="bg-boxing-red hover:bg-boxing-red/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Video Player Dialog */}
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          startTime={selectedVideo.startTime}
          open={!!selectedVideo}
          onOpenChange={(open) => !open && setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
