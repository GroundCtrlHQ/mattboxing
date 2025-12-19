import { NextRequest, NextResponse } from 'next/server';
import { searchVideos } from '@/lib/video-search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '3', 10);
    
    if (!query) {
      return NextResponse.json({ videos: [] });
    }
    
    const videos = await searchVideos({ query, limit });
    
    return NextResponse.json({
      videos: videos.map(v => ({
        video_id: v.video_id,
        title: v.video_title,
        topic: v.topic,
        subtopic: v.subtopic,
        url: v.url,
      })),
    });
  } catch (error: any) {
    console.error('Video search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search videos' },
      { status: 500 }
    );
  }
}

