'use client';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface VideoPlayerProps {
  videoId: string;
  title: string;
  topic?: string;
  subtopic?: string;
  startTime?: number; // in seconds
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  // Build YouTube embed URL with optional start time
  const embedUrl = `https://www.youtube.com/embed/${videoId}${startTime > 0 ? `?start=${startTime}&autoplay=1` : '?autoplay=1'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0">
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full rounded-t-lg"
              title={title}
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
      </DialogContent>
    </Dialog>
  );
}

