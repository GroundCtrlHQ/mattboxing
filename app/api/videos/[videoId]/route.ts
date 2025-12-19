import { NextRequest, NextResponse } from 'next/server';
import { getVideoById } from '@/lib/video-search';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const video = await getVideoById(videoId);

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ video });
  } catch (error: any) {
    console.error('Video fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get video' },
      { status: 500 }
    );
  }
}

