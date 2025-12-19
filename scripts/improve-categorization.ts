import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Improved categorization logic for boxing videos
 */
function extractTopic(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Tactics - strategy, positioning, distance, combinations
  if (
    text.includes('tactic') || text.includes('strategy') || 
    text.includes('distance') || text.includes('range') ||
    text.includes('combination') || text.includes('combo') ||
    text.includes('counter') || text.includes('feint') ||
    text.includes('angle') || text.includes('positioning') ||
    text.includes('timing') || text.includes('rhythm')
  ) {
    return 'Tactics';
  }
  
  // Training - drills, workouts, conditioning
  if (
    text.includes('training') || text.includes('drill') || 
    text.includes('workout') || text.includes('conditioning') ||
    text.includes('exercise') || text.includes('practice') ||
    text.includes('session') || text.includes('routine')
  ) {
    return 'Training';
  }
  
  // Mindset - mental, psychology, motivation
  if (
    text.includes('mindset') || text.includes('mental') || 
    text.includes('psychology') || text.includes('confidence') ||
    text.includes('motivation') || text.includes('focus') ||
    text.includes('discipline') || text.includes('ego')
  ) {
    return 'Mindset';
  }
  
  // Technique - default, form, punches, defense, footwork
  return 'Technique';
}

function extractSubtopic(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Punches
  if (text.includes('jab')) return 'Jab';
  if (text.includes('cross') || text.includes('straight')) return 'Cross';
  if (text.includes('hook')) return 'Hook';
  if (text.includes('uppercut')) return 'Uppercut';
  
  // Defense
  if (text.includes('slip')) return 'Slip';
  if (text.includes('roll')) return 'Roll';
  if (text.includes('block') || text.includes('parry')) return 'Block';
  if (text.includes('guard') || text.includes('defense')) return 'Guard';
  
  // Footwork & Movement
  if (text.includes('footwork') || text.includes('foot work')) return 'Footwork';
  if (text.includes('stance') || text.includes('orthodox') || text.includes('southpaw')) return 'Stance';
  if (text.includes('angle') || text.includes('cutting')) return 'Angles';
  if (text.includes('step') || text.includes('pivot')) return 'Movement';
  
  // Combinations
  if (text.includes('combination') || text.includes('combo')) return 'Combination';
  
  // Distance & Range
  if (text.includes('distance') || text.includes('range')) return 'Distance';
  
  // System & Methodology
  if (text.includes('system') || text.includes('number') || text.includes('tbl')) return 'System';
  
  // Power & Speed
  if (text.includes('power') || text.includes('punching power')) return 'Power';
  if (text.includes('speed') || text.includes('hand speed')) return 'Speed';
  
  return 'General';
}

function extractTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const allTags = [
    // Stances
    'orthodox', 'southpaw', 'switch',
    // Punches
    'jab', 'cross', 'hook', 'uppercut',
    // Defense
    'defense', 'guard', 'slip', 'roll', 'block', 'parry', 'counter',
    // Movement
    'footwork', 'stance', 'angle', 'movement', 'step', 'pivot',
    // Attributes
    'power', 'speed', 'range', 'form', 'technique',
    // Combinations
    'combo', 'combination',
    // Training
    'drill', 'training', 'workout',
    // Tactics
    'tactic', 'strategy', 'distance', 'timing', 'rhythm'
  ];
  
  return allTags.filter(tag => text.includes(tag));
}

async function recategorizeVideos() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const sql = neon(DATABASE_URL);

  console.log('🔄 Recategorizing all videos with improved logic...');

  // Get all videos
  const videos = await sql`
    SELECT video_id, video_title, topic, subtopic, tags
    FROM video_mapping
  `;

  console.log(`📊 Found ${videos.length} videos to recategorize`);

  let updated = 0;

  for (const video of videos) {
    const newTopic = extractTopic(video.video_title);
    const newSubtopic = extractSubtopic(video.video_title);
    const newTags = extractTags(video.video_title);

    // Only update if changed
    if (
      video.topic !== newTopic ||
      video.subtopic !== newSubtopic ||
      JSON.stringify(video.tags?.sort()) !== JSON.stringify(newTags.sort())
    ) {
      await sql`
        UPDATE video_mapping
        SET 
          topic = ${newTopic},
          subtopic = ${newSubtopic},
          tags = ${newTags},
          updated_at = NOW()
        WHERE video_id = ${video.video_id}
      `;
      updated++;
      console.log(`  ✅ Updated: ${video.video_title.substring(0, 50)}...`);
      console.log(`     ${video.topic} → ${newTopic} | ${video.subtopic} → ${newSubtopic}`);
    }
  }

  console.log(`\n✅ Recategorization complete! Updated ${updated} of ${videos.length} videos`);
  
  // Show summary by topic
  const summary = await sql`
    SELECT topic, COUNT(*) as count
    FROM video_mapping
    GROUP BY topic
    ORDER BY count DESC
  `;
  
  console.log('\n📊 Videos by Topic:');
  for (const row of summary) {
    console.log(`   ${row.topic}: ${row.count} videos`);
  }
}

recategorizeVideos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

