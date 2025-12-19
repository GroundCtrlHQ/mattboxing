'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { VideoPlayer } from './VideoPlayer';

interface VideoCardProps {
  video: {
    video_id: string;
    video_title: string;
    topic?: string;
    subtopic?: string;
    thumbnail?: string;
    view_count?: number;
  };
}

export function VideoCard({ video }: VideoCardProps) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(() => {
    // Use database thumbnail if available, otherwise generate YouTube thumbnail
    if (video.thumbnail) {
      return video.thumbnail;
    }
    // YouTube thumbnail URL format: https://img.youtube.com/vi/{video_id}/maxresdefault.jpg
    return `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`;
  });

  const handleImageError = () => {
    if (thumbnailUrl.includes('maxresdefault')) {
      // Fallback to high quality thumbnail
      setThumbnailUrl(`https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`);
    } else {
      // Final fallback - show placeholder
      setImageError(true);
    }
  };

  return (
    <>
      <Card
        className="overflow-hidden hover:border-boxing-red transition cursor-pointer group h-full"
        onClick={() => setIsPlayerOpen(true)}
      >
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <Play className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
              </div>
            ) : (
              <img
                src={thumbnailUrl}
                alt={video.video_title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
              <div className="bg-boxing-red/90 rounded-full p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white" />
              </div>
            </div>
          </AspectRatio>
        </div>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="line-clamp-2 text-sm sm:text-base">
            {video.video_title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
            {video.topic && (
              <Badge variant="default" className="text-xs">{video.topic}</Badge>
            )}
            {video.subtopic && (
              <Badge variant="secondary" className="text-xs">{video.subtopic}</Badge>
            )}
          </div>
          {video.view_count && (
            <p className="text-xs text-gray-400">
              {video.view_count.toLocaleString()} views
            </p>
          )}
        </CardContent>
      </Card>

      <VideoPlayer
        videoId={video.video_id}
        title={video.video_title}
        topic={video.topic}
        subtopic={video.subtopic}
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
      />
    </>
  );
}

