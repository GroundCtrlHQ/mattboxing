import { getDb } from './db';

export interface VideoSearchParams {
  query?: string; // Free text search
  category?: 'Technique' | 'Tactics' | 'Training' | 'Mindset';
  subtopic?: string;
  tags?: string[];
  limit?: number;
}

export interface VideoResult {
  video_id: string;
  video_title: string;
  topic: string;
  subtopic: string | null;
  tags: string[] | null;
  thumbnail: string | null;
  url: string | null;
  view_count: number;
}

/**
 * Search videos in the database
 * Supports free-text query search across title, topic, and subtopic
 */
export async function searchVideos(params: VideoSearchParams): Promise<VideoResult[]> {
  const sql = getDb();
  const limit = params.limit || 5;

  // If we have a free-text query, search for any matching word
  if (params.query) {
    // Split query into words and filter out short words
    const words = params.query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .slice(0, 3); // Max 3 words to keep query simple
    
    if (words.length === 0) {
      // Fallback to returning all videos
      const videos = await sql`
        SELECT 
          video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
        FROM video_mapping
        ORDER BY view_count DESC
        LIMIT ${limit}
      `;
      return videos as VideoResult[];
    }
    
    // Build search pattern - search for first word primarily
    const pattern1 = `%${words[0]}%`;
    const pattern2 = words[1] ? `%${words[1]}%` : pattern1;
    const pattern3 = words[2] ? `%${words[2]}%` : pattern1;
    
    // Simple OR-based search
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE LOWER(video_title) LIKE ${pattern1}
         OR LOWER(video_title) LIKE ${pattern2}
         OR LOWER(video_title) LIKE ${pattern3}
         OR LOWER(COALESCE(subtopic, '')) LIKE ${pattern1}
         OR LOWER(COALESCE(subtopic, '')) LIKE ${pattern2}
      ORDER BY view_count DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  // Structured search with category, subtopic, tags
  if (params.category && params.subtopic && params.tags && params.tags.length > 0) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE topic = ${params.category}
        AND subtopic ILIKE ${`%${params.subtopic}%`}
        AND tags && ${params.tags}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  if (params.category && params.subtopic) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE topic = ${params.category}
        AND subtopic ILIKE ${`%${params.subtopic}%`}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  if (params.category && params.tags && params.tags.length > 0) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE topic = ${params.category}
        AND tags && ${params.tags}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  if (params.subtopic && params.tags && params.tags.length > 0) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE subtopic ILIKE ${`%${params.subtopic}%`}
        AND tags && ${params.tags}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  if (params.category) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE topic = ${params.category}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  if (params.subtopic) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE subtopic ILIKE ${`%${params.subtopic}%`}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  if (params.tags && params.tags.length > 0) {
    const videos = await sql`
      SELECT 
        video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
      FROM video_mapping
      WHERE tags && ${params.tags}
      ORDER BY view_count DESC, created_at DESC
      LIMIT ${limit}
    `;
    return videos as VideoResult[];
  }

  // No filters - return all ordered by popularity
  const videos = await sql`
    SELECT 
      video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
    FROM video_mapping
    ORDER BY view_count DESC, created_at DESC
    LIMIT ${limit}
  `;
  return videos as VideoResult[];
}

/**
 * Get video by ID
 */
export async function getVideoById(videoId: string): Promise<VideoResult | null> {
  const sql = getDb();
  const videos = await sql`
    SELECT 
      video_id, video_title, topic, subtopic, tags, thumbnail, url, view_count
    FROM video_mapping
    WHERE video_id = ${videoId}
    LIMIT 1
  `;

  return (videos[0] as VideoResult) || null;
}
