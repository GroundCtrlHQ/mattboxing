import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// For scripts, create connection directly
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}
const sql = neon(process.env.DATABASE_URL);

/**
 * Store scraped videos in the database
 */
function extractTopic(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (text.includes('technique') || text.includes('form')) return 'Technique';
  if (text.includes('tactic') || text.includes('strategy') || text.includes('counter')) return 'Tactics';
  if (text.includes('training') || text.includes('drill') || text.includes('workout')) return 'Training';
  if (text.includes('mindset') || text.includes('mental')) return 'Mindset';
  return 'Technique'; // Default
}

function extractSubtopic(title: string): string {
  const techniques = [
    'jab', 'cross', 'hook', 'uppercut',
    'footwork', 'stance', 'defense', 'guard',
    'slip', 'roll', 'block', 'counter',
    'feint', 'combo', 'punch'
  ];
  
  const lowerTitle = title.toLowerCase();
  for (const tech of techniques) {
    if (lowerTitle.includes(tech)) {
      return tech.charAt(0).toUpperCase() + tech.slice(1);
    }
  }
  return 'General';
}

function extractTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const allTags = [
    'orthodox', 'southpaw', 'switch',
    'power', 'speed', 'range', 'form',
    'jab', 'cross', 'hook', 'uppercut',
    'footwork', 'defense', 'guard', 'stance',
    'slip', 'roll', 'block', 'counter', 'combo'
  ];
  return allTags.filter(tag => text.includes(tag));
}

async function storeCuratedVideos() {
  try {
    const dataPath = join(process.cwd(), 'data', 'videos-shorts.json');
    console.log(`📖 Reading videos from ${dataPath}...`);

    const videos = JSON.parse(readFileSync(dataPath, 'utf-8'));

    if (!Array.isArray(videos) || videos.length === 0) {
      throw new Error('No videos found in JSON file. Run scrape-videos.ts first.');
    }

    console.log(`📦 Storing ${videos.length} videos in database...`);

    let inserted = 0;
    let skipped = 0;

    for (const video of videos) {
      try {
        const topic = extractTopic(video.title, video.description);
        const subtopic = extractSubtopic(video.title);
        const tags = extractTags(video.title, video.description);

        await sql`
          INSERT INTO video_mapping (
            video_id,
            video_title,
            topic,
            subtopic,
            tags,
            url,
            thumbnail,
            view_count,
            published_time,
            created_at
          ) VALUES (
            ${video.videoId || video.id},
            ${video.title},
            ${topic},
            ${subtopic},
            ${tags},
            ${video.url},
            ${video.thumbnail || null},
            ${video.viewCount || 0},
            ${video.publishedTime ? new Date(video.publishedTime) : null},
            NOW()
          )
          ON CONFLICT (video_id) DO UPDATE SET
            video_title = EXCLUDED.video_title,
            topic = EXCLUDED.topic,
            subtopic = EXCLUDED.subtopic,
            tags = EXCLUDED.tags,
            url = EXCLUDED.url,
            thumbnail = EXCLUDED.thumbnail,
            view_count = EXCLUDED.view_count,
            updated_at = NOW()
        `;

        inserted++;
      } catch (error) {
        console.error(`❌ Error storing video ${video.videoId}:`, error);
        skipped++;
      }
    }

    console.log(`✅ Successfully stored ${inserted} videos`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} videos due to errors`);
    }
  } catch (error) {
    console.error('❌ Error storing videos:', error);
    throw error;
  }
}

// Run the storage script
storeCuratedVideos()
  .then(() => {
    console.log('✅ Storage complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Storage failed:', error);
    process.exit(1);
  });

