'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, MessageSquare, Trash2, Home, Video, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChatBot } from './ChatBot';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ChatSession {
  session_id: string;
  category?: string;
  created_at: Date;
  updated_at: Date;
  first_message?: string;
  message_count: number;
}

interface ChatInterfaceProps {
  initialSessionId?: string | null;
  sessions: ChatSession[];
}

export function ChatInterface({ initialSessionId, sessions: initialSessions }: ChatInterfaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Parse dates from API response
  const parseSessions = (sessions: any[]): ChatSession[] => {
    return sessions.map(s => ({
      ...s,
      created_at: s.created_at ? new Date(s.created_at) : new Date(),
      updated_at: s.updated_at ? new Date(s.updated_at) : new Date(),
    }));
  };

  const [sessions, setSessions] = useState<ChatSession[]>(parseSessions(initialSessions));
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Extract sessionId from URL
  const sessionIdFromUrl = pathname?.split('/chat/')[1] || null;
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessionIdFromUrl || initialSessionId || null
  );

  // Sync with URL changes
  useEffect(() => {
    const sessionId = pathname?.split('/chat/')[1] || null;
    setCurrentSessionId(sessionId);
  }, [pathname]);

  // Refresh sessions on mount and when pathname changes
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoadingSessions(true);
        const response = await fetch('/api/chat?getAll=true');
        if (response.ok) {
          const data = await response.json();
          setSessions(parseSessions(data.sessions || []));
        } else {
          // Fallback to initial sessions if API fails
          setSessions(parseSessions(initialSessions));
        }
      } catch (error) {
        console.error('Failed to refresh sessions:', error);
        // Fallback to initial sessions on error
        setSessions(parseSessions(initialSessions));
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSessions();
  }, [pathname, initialSessions]);

  // Generate new session ID
  const createNewSession = () => {
    const newSessionId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    router.push(`/chat/${newSessionId}`);
    setCurrentSessionId(newSessionId);
  };

  // Navigate to session
  const navigateToSession = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
    setCurrentSessionId(sessionId);
  };

  // Refresh sessions from API
  const refreshSessions = async () => {
    try {
      const response = await fetch('/api/chat?getAll=true');
      if (response.ok) {
        const data = await response.json();
        setSessions(parseSessions(data.sessions || []));
      }
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete session');
      
      // Refresh sessions after deletion
      await refreshSessions();
      
      if (currentSessionId === sessionId) {
        router.push('/chat');
        setCurrentSessionId(null);
      }
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  // Format session title
  const getSessionTitle = (session: ChatSession) => {
    if (session.first_message) {
      return session.first_message;
    }
    return 'New Chat';
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return 'Recently';
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older dates, show the actual date
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const currentYear = now.getFullYear();
    
    if (year === currentYear) {
      return `${month} ${day}`;
    }
    return `${month} ${day}, ${year}`;
  };

  return (
    <div className="flex h-screen bg-charcoal text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <Button
            onClick={createNewSession}
            className="w-full bg-boxing-red hover:bg-boxing-red/90"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                onClick={() => navigateToSession(session.session_id)}
                className={cn(
                  'group relative flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors',
                  currentSessionId === session.session_id
                    ? 'bg-boxing-red/20 border border-boxing-red/30'
                    : 'hover:bg-gray-800'
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white break-words leading-relaxed">
                    {getSessionTitle(session)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(session.updated_at || session.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.session_id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity flex-shrink-0"
                  title="Delete session"
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-boxing-red" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Navigation Links */}
        <div className="border-t border-gray-800 p-4 space-y-2">
          <Separator className="bg-gray-800 mb-2" />
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              size="sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link href="/videos">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              size="sm"
            >
              <Video className="w-4 h-4 mr-2" />
              Videos
            </Button>
          </Link>
          <Link href="/coach">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Coach
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              size="sm"
            >
              <User className="w-4 h-4 mr-2" />
              About Matt
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentSessionId ? (
          <div className="h-full">
            <ChatBot sessionId={currentSessionId} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Select a chat or start a new one
              </h2>
              <p className="text-gray-400 mb-6">
                Choose a conversation from the sidebar or create a new chat
              </p>
              <Button onClick={createNewSession} className="bg-boxing-red hover:bg-boxing-red/90">
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

