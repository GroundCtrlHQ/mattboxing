'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  topic?: string;
  subtopic?: string;
  startTime?: number; // in seconds
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Validate YouTube video ID format
function isValidYouTubeId(videoId: string): boolean {
  // YouTube IDs are typically 11 characters, alphanumeric with dashes and underscores
  // They should not look like Mux playback IDs (which have different format)
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

// Extract YouTube ID from various formats
function extractYouTubeId(videoId: string): string | null {
  // If it's already a valid YouTube ID, return it
  if (isValidYouTubeId(videoId)) {
    return videoId;
  }

  // Try to extract from YouTube URL
  const urlPatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of urlPatterns) {
    const match = videoId.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function VideoPlayer({
  videoId,
  title,
  topic,
  subtopic,
  startTime = 0,
  open,
  onOpenChange,
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [validVideoId, setValidVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (open && videoId) {
      const extracted = extractYouTubeId(videoId);
      if (extracted) {
        setValidVideoId(extracted);
        setHasError(false);
      } else {
        console.error('[VideoPlayer] Invalid YouTube video ID:', videoId);
        setValidVideoId(null);
        setHasError(true);
      }
    }
  }, [open, videoId]);

  // Build YouTube embed URL with optional start time
  const embedUrl = validVideoId
    ? `https://www.youtube.com/embed/${validVideoId}${startTime > 0 ? `?start=${startTime}&autoplay=1` : '?autoplay=1'}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0">
        {hasError || !validVideoId ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Video Error</h3>
            <p className="text-gray-400 mb-4">
              Unable to load video. The video ID format may be invalid.
            </p>
            <p className="text-sm text-gray-500">
              Video ID: {videoId}
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <AspectRatio ratio={16 / 9}>
                <iframe
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full rounded-t-lg"
                  title={title}
                  onError={() => setHasError(true)}
                />
              </AspectRatio>
            </div>
            <DialogHeader className="px-4 sm:px-6 py-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {topic && (
                  <Badge variant="default" className="text-xs">{topic}</Badge>
                )}
                {subtopic && (
                  <Badge variant="secondary" className="text-xs">{subtopic}</Badge>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg text-left pr-8">
                {title}
              </DialogTitle>
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

