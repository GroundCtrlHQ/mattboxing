import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Manually add specific videos with curated metadata
 * Reads from scripts/manual-videos.json for easy editing
 */
async function addManualVideos() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const sql = neon(DATABASE_URL);

  // Read manual videos from JSON file
  const manualVideosPath = join(process.cwd(), 'scripts', 'manual-videos.json');
  const manualVideos = JSON.parse(readFileSync(manualVideosPath, 'utf-8'));

  console.log(`📝 Adding ${manualVideos.length} manually curated videos...`);

  let inserted = 0;
  let updated = 0;

  for (const video of manualVideos) {
    try {
      // Generate thumbnail URL from video ID
      const thumbnail = `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`;
      
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
          ${video.video_id},
          ${video.video_title},
          ${video.topic},
          ${video.subtopic},
          ${video.tags || []},
          ${video.url},
          ${thumbnail},
          ${video.view_count || 0},
          ${video.published_time || null},
          NOW()
        )
        ON CONFLICT (video_id) DO UPDATE SET
          video_title = EXCLUDED.video_title,
          topic = EXCLUDED.topic,
          subtopic = EXCLUDED.subtopic,
          tags = EXCLUDED.tags,
          url = EXCLUDED.url,
          thumbnail = EXCLUDED.thumbnail,
          updated_at = NOW()
      `;

      // Check if it was an insert or update
      const existing = await sql`
        SELECT created_at, updated_at 
        FROM video_mapping 
        WHERE video_id = ${video.video_id}
      `;
      
      if (existing[0]?.created_at?.getTime() === existing[0]?.updated_at?.getTime()) {
        inserted++;
        console.log(`  ✅ Inserted: ${video.video_title}`);
      } else {
        updated++;
        console.log(`  🔄 Updated: ${video.video_title}`);
      }
    } catch (error: any) {
      console.error(`  ❌ Error adding ${video.video_title}:`, error.message);
    }
  }

  console.log(`\n✅ Complete! Inserted: ${inserted}, Updated: ${updated}`);
}

addManualVideos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

