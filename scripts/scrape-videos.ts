import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Scrape Boxing Locker channel shorts using SCRAPECREATORS API
 * Endpoint: /v1/youtube/channel/shorts/simple
 * Cost: 1 credit per 48 items returned
 */
async function scrapeBoxingLockerShorts() {
  const API_KEY = process.env.SCRAPECREATORS_API_KEY;
  const CHANNEL_HANDLE = 'TheBoxingLocker'; // YouTube handle
  const AMOUNT = 100; // Get 100 shorts (costs ~2-3 credits)

  if (!API_KEY) {
    throw new Error('SCRAPECREATORS_API_KEY is not set in environment variables');
  }

  try {
    console.log(`🔍 Fetching ${AMOUNT} shorts from ${CHANNEL_HANDLE}...`);

    // Fetch shorts from SCRAPECREATORS API
    const response = await fetch(
      `https://api.scrapecreators.com/v1/youtube/channel/shorts/simple?handle=${CHANNEL_HANDLE}&amount=${AMOUNT}`,
      {
        headers: {
          'x-api-key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    const shorts = data.shorts || data.videos || data || [];

    console.log(`✅ Fetched ${shorts.length} shorts from channel`);

    if (shorts.length === 0) {
      console.warn('⚠️  No shorts returned. Check API key and channel handle.');
      return [];
    }

    // Filter by relevance keywords
    const relevantKeywords = [
      'stance',
      'orthodox',
      'southpaw',
      'switch',
      'jab',
      'cross',
      'hook',
      'uppercut',
      'footwork',
      'defense',
      'guard',
      'technique',
      'form',
      'drill',
      'training',
      'punch',
      'combo',
      'slip',
      'roll',
      'block',
      'counter',
      'feint',
      'angle',
      'movement',
    ];

    const relevantShorts = shorts
      .filter((video: any) => {
        const title = (video.title || '').toLowerCase();
        const description = (video.description || '').toLowerCase();
        return relevantKeywords.some(
          (keyword) => title.includes(keyword) || description.includes(keyword)
        );
      })
      .sort((a: any, b: any) => {
        // Sort by view count if available, otherwise by published date
        const aViews = a.viewCountInt || a.viewCount || 0;
        const bViews = b.viewCountInt || b.viewCount || 0;
        return bViews - aViews;
      })
      .slice(0, 50); // Top 50 most relevant

    console.log(`📊 Filtered to ${relevantShorts.length} relevant shorts`);

    // Transform to our format
    const formattedShorts = relevantShorts.map((video: any) => ({
      id: video.id || video.videoId,
      videoId: video.id || video.videoId,
      title: video.title,
      description: video.description || '',
      url: video.url || `https://www.youtube.com/watch?v=${video.id || video.videoId}`,
      thumbnail: video.thumbnail,
      viewCount: video.viewCountInt || video.viewCount || 0,
      publishedTime: video.publishedTime || video.publishedAt,
      lengthSeconds: video.lengthSeconds || 0,
    }));

    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    mkdirSync(dataDir, { recursive: true });

    // Save to JSON
    const outputPath = join(dataDir, 'videos-shorts.json');
    writeFileSync(outputPath, JSON.stringify(formattedShorts, null, 2));

    console.log(`💾 Saved ${formattedShorts.length} videos to ${outputPath}`);
    console.log(`💰 Estimated cost: ~${Math.ceil(AMOUNT / 48)} credits`);

    return formattedShorts;
  } catch (error) {
    console.error('❌ Error scraping videos:', error);
    throw error;
  }
}

// Run the scraper
scrapeBoxingLockerShorts()
  .then(() => {
    console.log('✅ Scraping complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  });

