import Link from 'next/link';
import { getDb } from '@/lib/db';
import { Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
import { VideoPlayer } from '@/components/VideoPlayer';
import { VideoCard } from '@/components/VideoCard';

async function getVideos() {
  try {
    const sql = getDb();
    const videos = await sql`
      SELECT 
        video_id,
        video_title,
        topic,
        subtopic,
        tags,
        url,
        thumbnail,
        view_count,
        published_time
      FROM video_mapping
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
}

export default async function VideosPage() {
  const videos = await getVideos();

  return (
    <main className="min-h-screen bg-charcoal">
      {/* Header - Mobile First */}
      <header className="border-b border-gray-800 sticky top-0 bg-charcoal z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-boxing-red">
              The Boxing Locker
            </Link>
            <nav className="hidden sm:flex gap-4 md:gap-6">
              <Link href="/" className="text-gray-300 hover:text-white text-sm md:text-base">Home</Link>
              <Link href="/videos" className="text-white font-semibold text-sm md:text-base">Videos</Link>
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm md:text-base">AI Coach</Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm md:text-base">About Matt</Link>
            </nav>
            {/* Mobile menu */}
            <div className="sm:hidden flex gap-2">
              <Link href="/" className="text-gray-300 hover:text-white text-sm">Home</Link>
              <Link href="/coach" className="text-gray-300 hover:text-white text-sm">Coach</Link>
              <Link href="/about" className="text-gray-300 hover:text-white text-sm">About</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Page Header - Mobile First */}
      <section className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 text-white">
            Video Library
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300">
            Browse Matt's comprehensive collection of boxing technique videos
          </p>
        </div>
      </section>

      {/* Videos Grid - Mobile First */}
      <section className="container mx-auto px-4 pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto">
          {videos.length === 0 ? (
            <Empty className="min-h-[400px]">
              <EmptyMedia variant="icon">
                <Play className="size-8" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No videos found</EmptyTitle>
                <EmptyDescription className="text-xs sm:text-sm">
                  Run the scraping script to populate videos: <code className="bg-gray-800 px-2 py-1 rounded text-boxing-red text-xs">npm run scrape</code>
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {videos.map((video: any) => (
                <VideoCard key={video.video_id} video={video} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
