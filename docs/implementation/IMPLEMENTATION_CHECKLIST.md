# Boxing Coach AI - Implementation Checklist

## Project Overview
Building an AI-powered boxing coaching application that serves as a "Digital Twin" of Matt Goddard (The Boxing Locker), utilizing his 600+ technical videos and 20+ years of experience.

**YouTube Channel**: https://www.youtube.com/c/TheBoxingLocker

---

## Phase 1: Project Setup & Configuration ✅ COMPLETE

### 1.1 Next.js Project Initialization ✅
- [x] Initialize Next.js 16 project with App Router
- [x] Configure TypeScript
- [x] Set up Tailwind CSS v4
- [x] Install Lucide Icons
- [x] Set up project structure (app/, components/, lib/, scripts/)
- [x] Configure environment variables (.env.local.example)
  - [x] `DATABASE_URL` (Neon connection string)
  - [x] `SCRAPECREATORS_API_KEY`
  - [x] `OPENROUTER_API_KEY` (for future AI)

### 1.2 Design System Setup ✅
- [x] Configure global CSS with design tokens:
  - [x] Charcoal Black (#0A0A0A) - primary background
  - [x] Boxing Red (#DC2626) - accent/action color
  - [x] Champion Gold (#F59E0B) - premium/action cues
- [x] Set up typography (Inter font)
- [x] Configure dark theme as default ("Gym Dark" aesthetic)
- [x] Create basic UI components (Home, Videos, About pages)

---

## Phase 2: Database Setup (Neon PostgreSQL) ✅ COMPLETE

### 2.1 Neon Database Configuration ✅
- [x] Verify Neon connection string in `.env.local`
- [x] Install `@neondatabase/serverless` package
- [x] Create database connection utility (`lib/db.ts`)
- [x] Set up connection pooling for serverless functions

### 2.2 Database Schema Implementation ✅
- [ ] Create `users` table:
  ```sql
  - id (UUID, primary key)
  - email (VARCHAR, unique)
  - subscriptionTier (VARCHAR: Free/Pro/Elite)
  - createdAt (TIMESTAMP)
  - updatedAt (TIMESTAMP)
  ```

- [ ] Create `profiles` table:
  ```sql
  - userId (UUID, foreign key -> users.id)
  - name (VARCHAR)
  - stance (VARCHAR: Orthodox/Southpaw/Switch)
  - experience (VARCHAR: Beginner/Intermediate/Pro)
  - weightKg (INTEGER)
  - heightCm (INTEGER)
  - goals (TEXT/JSON)
  - createdAt (TIMESTAMP)
  - updatedAt (TIMESTAMP)
  ```

- [ ] Create `coaching_sessions` table:
  ```sql
  - id (UUID, primary key)
  - userId (UUID, foreign key -> users.id)
  - category (VARCHAR: Technique/Tactics/Training/Mindset)
  - formData (JSONB)
  - aiResponse (TEXT)
  - mappedVideoId (VARCHAR - YouTube video ID)
  - mappedTimestamp (INTEGER - seconds)
  - createdAt (TIMESTAMP)
  ```

### 2.3 Neon Vector Database Setup
- [ ] Enable pgvector extension in Neon:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

- [ ] Create `video_embeddings` table for semantic search:
  ```sql
  - id (UUID, primary key)
  - videoId (VARCHAR - YouTube ID)
  - videoTitle (VARCHAR)
  - videoDescription (TEXT)
  - topic (VARCHAR)
  - subtopic (VARCHAR)
  - keyTimestamps (JSONB - array of {timestamp, description})
  - embedding (vector(1536) - OpenAI embedding dimension)
  - createdAt (TIMESTAMP)
  ```

- [ ] Create vector index for similarity search:
  ```sql
  CREATE INDEX ON video_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
  ```

- [x] Create `video_mapping` table (Gold Standard mapping):
  ```sql
  - id (UUID, primary key)
  - video_id (VARCHAR - YouTube ID, unique)
  - video_title (VARCHAR)
  - topic (VARCHAR: Technique/Tactics/Training/Mindset)
  - subtopic (VARCHAR: e.g., "Jab", "Footwork")
  - tags (TEXT[] - for searchability)
  - url, thumbnail, view_count, published_time
  - key_timestamps (JSONB)
  - created_at, updated_at (TIMESTAMP)
  ```

### 2.4 Database Migration Scripts ✅
- [x] Create migration script in `scripts/create-tables.sql`
- [x] Includes indexes for performance
- [x] Includes pgvector extension setup (for future)
- [x] Ready to run: `psql $DATABASE_URL < scripts/create-tables.sql`

---

## Phase 3: OpenRouter AI Integration ✅ COMPLETE

### 3.1 OpenRouter Setup ✅
- [x] Install OpenRouter SDK or use fetch API
- [x] Create OpenRouter client utility (`lib/openrouter.ts`)
- [x] Configure model: `anthropic/claude-3-5-sonnet`
- [x] Set up API key from environment variable

### 3.2 AI Agent Configuration ✅
- [x] Create system prompt for "Matt Goddard" persona:
  - [x] British, direct, technical voice
  - [x] "No-nonsense" yet motivational tone
  - [x] Focus on biomechanics
  - [x] "Value of Looks" philosophy
  - [x] Five Boxing Philosophies: Brain, Legs, Hands, Heart, Ego
  - [x] Instruction to always provide video references with timestamps

- [x] Create prompt template system (`lib/openrouter.ts`)
- [x] Implement context injection (user profile, stance, experience)
- [x] Set up streaming response handler

### 3.3 AI Response Processing ✅
- [x] Create API route for chat completions (`app/api/coach/route.ts`)
- [x] Implement streaming response handling
- [x] Parse AI responses for video references
- [x] Extract video IDs and timestamps from AI responses
- [x] Handle errors and rate limiting
- [x] **Tool Calling Integration** - AI can directly query video library
  - [x] `search_video_library` tool function
  - [x] Server-side tool execution
  - [x] Automatic video recommendations based on coaching context

---

## Phase 4: Video Scraping & Curation (DEMO FIRST APPROACH)

**Strategy**: Start with a curated "small list" of relevant shorts (20-50 videos) for the demo, then expand to full library later.

**Workflow**:
1. Scrape YouTube channel using SCRAPECREATORS
2. Filter for Shorts (most relevant for technique demos)
3. Store curated list in database
4. Use this list for AI video recommendations in demo
5. Expand to full 600+ video library post-demo

### 4.1 Video Scraping Setup
- [ ] Set up SCRAPECREATORS integration
- [ ] Configure YouTube channel scraping:
  - [ ] Channel URL: `https://www.youtube.com/c/TheBoxingLocker`
  - [ ] Focus on **Shorts** (most relevant for technique demonstrations)
  - [ ] Extract video metadata:
    - [ ] Video ID
    - [ ] Title
    - [ ] Description
    - [ ] Duration
    - [ ] Thumbnail URL
    - [ ] Published date
    - [ ] View count (for relevance ranking)

### 4.2 Video Scraping Script ✅
- [x] Create scraping script (`scripts/scrape-videos.ts`):
  - [x] Use SCRAPECREATORS API endpoint: `/v1/youtube/channel/shorts/simple`
  - [x] Pass channel handle: `TheBoxingLocker`
  - [x] Request amount: 100 shorts (costs ~2-3 credits)
  - [x] Filter by relevance keywords:
    - [x] Stance-related terms (Orthodox, Southpaw, Switch)
    - [x] Technique terms (Jab, Cross, Hook, Uppercut, Footwork, etc.)
    - [x] Training terms (Form, Technique, Drill, Combo, Slip, Roll, etc.)
  - [x] Sort by view count (most popular first)
  - [x] Limit to top 50 most relevant shorts for demo
  - [x] Transform and format data for our schema
- [x] Export scraped data to JSON file (`data/videos-shorts.json`)
- [x] Add error handling for API failures
- [x] Log credit usage and costs
- [x] Run with: `npm run scrape`

### 4.3 Store Curated Video List ✅
- [x] Create script to populate `video_mapping` table (`scripts/store-videos.ts`):
  - [x] Read from `data/videos-shorts.json`
  - [x] Insert into `video_mapping` table with:
    - [x] Video ID (YouTube ID from scraped data)
    - [x] Video Title
    - [x] Topic (infer from title/description: Technique/Tactics/Training/Mindset)
    - [x] Subtopic (extract from title: e.g., "Jab", "Footwork", "Stance")
    - [x] Tags (extract keywords from title/description as TEXT array)
    - [x] URL, thumbnail, view_count, published_time
    - [x] Initial keyTimestamps (JSONB, empty for now)
  - [x] Handle duplicate videos (ON CONFLICT DO UPDATE)
  - [x] Log insertion progress
- [x] Run with: `npm run store`
- [x] Frontend displays videos from database

### 4.4 YouTube Integration ✅
- [x] Set up YouTube IFrame API
- [x] Create YouTube player component (`components/VideoPlayer.tsx`)
- [x] Implement timestamp-aware video embedding
- [x] Handle video loading and error states
- [x] Create video preview section component (Dialog modal)

### 4.5 Video Mapping System (Using Curated List) ✅
- [x] Create video mapping service (`lib/video-search.ts`)
- [x] Implement "Gold Standard" mapping logic using curated list:
  - [x] Query `video_mapping` table for relevant videos
  - [x] Match user queries to video IDs based on:
    - [x] Topic match (Technique/Tactics/Training/Mindset)
    - [x] Subtopic match (e.g., "Jab" -> Jab videos)
    - [x] Tag matching
  - [x] Return video with suggested timestamp (if available)
- [x] Create simple search function (SQL-based, not vector for demo)
- [x] Implement fallback logic if no exact match found
- [x] **AI Tool Integration** - AI can search videos via tool calling

### 4.6 Neural-Link Video Integration
- [ ] Create component to detect video references in AI responses
- [ ] Implement automatic video player injection
- [ ] Parse timestamp mentions (e.g., "at 2:45", "see 1:15")
- [ ] Create "Watch Matt Demonstrate" section component
- [ ] Handle multiple video references in single response
- [ ] Use curated video list for demo responses

### 4.7 Future: Video Embedding Generation (Post-Demo)
- [ ] Create script to generate embeddings for curated videos:
  - [ ] Fetch video metadata from YouTube
  - [ ] Generate embeddings using OpenAI API (or OpenRouter)
  - [ ] Store embeddings in `video_embeddings` table
- [ ] Expand to full 600+ video library later
- [ ] Set up incremental update process for new videos

---

## Phase 5: Frontend Pages ✅ COMPLETE

### 5.1 Home Page ✅
- [x] Create home page (`app/page.tsx`)
- [x] Hero section with Matt's credentials
- [x] Features section
- [x] Five Boxing Philosophies display
- [x] Navigation to Videos and About pages

### 5.2 About Matt Page ✅
- [x] Create about page (`app/about/page.tsx`)
- [x] Bio section with 20+ years experience
- [x] Achievements (7-0 Pro, National Champion)
- [x] Five Boxing Philosophies detailed view
- [x] Call-to-action to browse videos

### 5.3 Videos Page ✅
- [x] Create videos page (`app/videos/page.tsx`)
- [x] Display videos from database
- [x] Video cards with thumbnails
- [x] Topic and subtopic badges
- [x] Links to YouTube videos
- [x] Empty state when no videos

---

## Phase 6: User Onboarding & Profile (Future)

### 5.1 Onboarding Flow
- [ ] Create onboarding page (`app/onboarding/page.tsx`)
- [ ] Implement multi-step form:
  - [ ] Step 1: Name and Email
  - [ ] Step 2: Stance selection (Orthodox/Southpaw/Switch)
  - [ ] Step 3: Experience level (Beginner/Intermediate/Pro)
  - [ ] Step 4: Physical stats (Weight, Height)
  - [ ] Step 5: Goals (multi-select or text)
- [ ] Create form validation
- [ ] Implement progress indicator
- [ ] Store profile data in Neon DB

### 5.2 Profile Management
- [ ] Create profile API routes:
  - [ ] `GET /api/profile` - fetch user profile
  - [ ] `POST /api/profile` - create/update profile
- [ ] Create profile display component
- [ ] Implement profile editing functionality
- [ ] Add profile context provider

---

## Phase 6: Form-Based Coaching System ✅ COMPLETE

### 6.1 Coaching Form Interface ✅
- [x] Create coaching interface page (`app/coach/page.tsx`)
- [x] Implement Phase 1 selection:
  - [x] Technique
  - [x] Tactics
  - [x] Training
  - [x] Mindset
- [x] Create Phase 2 granular detail forms:
  - [x] Technique variations (e.g., Jab -> Power/Speed/Range)
  - [x] Tactical scenarios
  - [x] Training types
  - [x] Mindset topics
- [x] Implement Phase 3 contextual constraints:
  - [x] Location (Gym vs. Home)
  - [x] Equipment availability
  - [x] Time constraints

### 6.2 Form Logic & State Management ✅
- [x] Create form state management (use React Hook Form or similar)
- [x] Implement conditional form fields based on selections
- [x] Create form data validation
- [ ] Store form submissions in `coaching_sessions` table (future enhancement)

### 6.3 AI Coaching Response ✅
- [x] Create API route for coaching requests (`app/api/coach/route.ts`)
- [x] Build prompt with form data and user profile
- [x] Call OpenRouter API with context
- [x] Process AI response and extract video references
- [ ] Store coaching session in database (future enhancement)
- [x] Return formatted response with video embeds

---

## Phase 7: UI/UX Implementation

### 7.1 Layout & Navigation
- [ ] Create main layout (`app/layout.tsx`)
- [ ] Implement navigation header
- [ ] Create responsive mobile menu
- [ ] Add loading states and skeletons
- [ ] Implement error boundaries

### 7.2 Coaching Interface UI
- [ ] Design form-based coaching UI
- [ ] Create AI response display area
- [ ] Implement video player section
- [ ] Add "Watch Matt Demonstrate" highlight section
- [ ] Create session history view
- [ ] Implement stance-aware UI adjustments

### 7.3 Visual Design
- [ ] Apply "Gym Dark" color scheme throughout
- [ ] Use Boxing Red for action buttons and highlights
- [ ] Use Champion Gold for premium/important cues
- [ ] Implement bold typography
- [ ] Add smooth transitions and animations
- [ ] Ensure mobile responsiveness

### 7.4 Components to Build
- [ ] `OnboardingForm` - multi-step onboarding
- [ ] `CoachingForm` - 3-phase coaching form
- [ ] `AIResponse` - displays AI coaching response
- [ ] `VideoPlayer` - YouTube player with timestamp support
- [ ] `VideoPreview` - "Watch Matt Demonstrate" section
- [ ] `ProfileCard` - user profile display
- [ ] `SessionHistory` - past coaching sessions
- [ ] `StanceAwareBadge` - shows user's stance context

---

## Phase 8: Advanced Features

### 8.1 Vector Search Integration
- [ ] Create semantic search function using pgvector
- [ ] Implement query embedding generation
- [ ] Build video recommendation system based on user queries
- [ ] Create similarity search API endpoint
- [ ] Test search accuracy and performance

### 8.2 Session History & Analytics
- [ ] Create session history page
- [ ] Implement session filtering and search
- [ ] Add analytics tracking (optional)
- [ ] Create export functionality for sessions

### 8.3 Subscription Tiers (Future)
- [ ] Design subscription tier system
- [ ] Implement tier-based feature access
- [ ] Create upgrade prompts
- [ ] Add tier badges/indicators

---

## Phase 9: Testing & Optimization

### 9.1 Functionality Testing
- [ ] Test onboarding flow end-to-end
- [ ] Test coaching form with all combinations
- [ ] Verify AI responses include video references
- [ ] Test video player timestamp functionality
- [ ] Verify stance-aware responses
- [ ] Test vector search accuracy
- [ ] Test database queries and performance

### 9.2 Performance Optimization
- [ ] Optimize database queries
- [ ] Implement response caching where appropriate
- [ ] Optimize video embedding generation
- [ ] Test streaming response performance
- [ ] Optimize bundle size
- [ ] Implement lazy loading for videos

### 9.3 Error Handling
- [ ] Add error handling for API failures
- [ ] Handle OpenRouter API errors gracefully
- [ ] Handle YouTube API errors
- [ ] Add database error handling
- [ ] Create user-friendly error messages

---

## Phase 10: Deployment & Documentation

### 10.1 Deployment Preparation
- [ ] Set up production environment variables
- [ ] Configure Neon production database
- [ ] Set up Vercel deployment (or preferred platform)
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging

### 10.2 Documentation
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Document database schema
- [ ] Create developer setup guide
- [ ] Document video mapping process

### 10.3 Success Criteria Validation
- [ ] ✅ Stance Awareness: AI adjusts technical breakdown based on user stance
- [ ] ✅ Video Injection: YouTube player appears automatically with correct video
- [ ] ✅ "Aha" Moment: AI refers to specific timestamps that solve form problems
- [ ] ✅ Form-Based Coaching: 3-phase form system works correctly
- [ ] ✅ Profile Persistence: User data saved and retrieved correctly
- [ ] ✅ Vector Search: Semantic video search returns relevant results

---

## Technical Notes

### Key Dependencies
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "@neondatabase/serverless": "^0.5.0",
  "pgvector": "^0.1.0",
  "openai": "^4.0.0", // or OpenRouter SDK
  "lucide-react": "^0.400.0",
  "@radix-ui/react-*": "latest", // for shadcn components
  "tailwindcss": "^4.0.0",
  "scrapecreators": "^latest" // or your scraping tool
}
```

### Environment Variables Required
```env
DATABASE_URL=postgresql://... # Neon connection string
OPENROUTER_API_KEY=sk-or-...
SCRAPECREATORS_API_KEY=... # Required for video scraping
NEXT_PUBLIC_YOUTUBE_API_KEY=... # Optional, for additional metadata
```

### SCRAPECREATORS API Usage & Costs
- **Endpoint**: `/v1/youtube/channel/shorts/simple`
- **Cost**: 1 credit per 48 items returned
- **Example**: Requesting 100 shorts = ~2-3 credits
- **Channel Handle**: `TheBoxingLocker`
- **Note**: API handles pagination automatically, making it easier than manual pagination

### Important Considerations
- Use Neon's serverless driver for edge compatibility
- Implement proper connection pooling
- Use pgvector for semantic video search
- Cache video embeddings to reduce API calls
- Implement rate limiting for OpenRouter API
- Handle YouTube API quota limits
- Consider batch processing for 600+ video embeddings

---

## Next Steps After POC
1. Expand video library mapping
2. Add user authentication
3. Implement subscription tiers
4. Add progress tracking
5. Create mobile app version
6. Add social features (share sessions)
7. Implement advanced analytics

---

## Quick Reference: Code Examples

### Neon Database Connection (lib/db.ts)
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };
```

### Enable pgvector Extension
```sql
-- Run this in Neon SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### OpenRouter API Integration (lib/openrouter.ts)
```typescript
export async function chatWithMatt(
  messages: Array<{ role: string; content: string }>,
  userProfile: any
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || '',
      'X-Title': 'Boxing Coach AI',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet',
      messages: [
        {
          role: 'system',
          content: `You are Matt Goddard, "The Boxing Locker" (7-0 Pro, National Champ).
            Voice: British, direct, technical, "no-nonsense" yet highly motivational.
            Philosophy: Focus on the "Five Boxing Philosophies": Brain, Legs, Hands, Heart, and Ego.
            User Profile: ${JSON.stringify(userProfile)}
            IMPORTANT: Always provide video references with specific timestamps when discussing techniques.`,
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  return response;
}
```

### Vector Search Query (lib/vectorSearch.ts)
```typescript
import { sql } from './db';

export async function searchVideos(queryEmbedding: number[], limit = 5) {
  const results = await sql`
    SELECT 
      video_id,
      video_title,
      topic,
      subtopic,
      key_timestamps,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    FROM video_embeddings
    ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    LIMIT ${limit}
  `;
  
  return results;
}
```

### YouTube Player with Timestamp (components/VideoPlayer.tsx)
```typescript
'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  startTime?: number; // in seconds
}

export function VideoPlayer({ videoId, startTime = 0 }: VideoPlayerProps) {
  const playerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (playerRef.current && startTime > 0) {
      // YouTube iframe API allows start parameter
      const url = `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
      playerRef.current.src = url;
    }
  }, [videoId, startTime]);

  return (
    <iframe
      ref={playerRef}
      width="100%"
      height="400"
      src={`https://www.youtube.com/embed/${videoId}${startTime > 0 ? `?start=${startTime}` : ''}`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="rounded-lg"
    />
  );
}
```

### Video Scraping Script Example (scripts/scrape-videos.ts)
```typescript
import { writeFileSync } from 'fs';

/**
 * Scrape Boxing Locker channel shorts using SCRAPECREATORS API
 * Endpoint: /v1/youtube/channel/shorts/simple
 * Cost: 1 credit per 48 items returned
 */
async function scrapeBoxingLockerShorts() {
  const API_KEY = process.env.SCRAPECREATORS_API_KEY;
  const CHANNEL_HANDLE = 'TheBoxingLocker'; // or use channelId
  const AMOUNT = 100; // Get 100 shorts (costs ~2-3 credits)
  
  try {
    // Fetch shorts from SCRAPECREATORS API
    const response = await fetch(
      `https://api.scrapecreators.com/v1/youtube/channel/shorts/simple?handle=${CHANNEL_HANDLE}&amount=${AMOUNT}`,
      {
        headers: {
          'x-api-key': API_KEY!,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const shorts = data.shorts || data.videos || []; // Adjust based on actual response structure
    
    console.log(`Fetched ${shorts.length} shorts from channel`);
    
    // Filter by relevance keywords
    const relevantKeywords = [
      'stance', 'orthodox', 'southpaw', 'switch',
      'jab', 'cross', 'hook', 'uppercut',
      'footwork', 'defense', 'guard',
      'technique', 'form', 'drill', 'training',
      'punch', 'combo', 'slip', 'roll', 'block'
    ];
    
    const relevantShorts = shorts
      .filter((video: any) => {
        const title = (video.title || '').toLowerCase();
        const description = (video.description || '').toLowerCase();
        return relevantKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        );
      })
      .sort((a: any, b: any) => {
        // Sort by view count if available, otherwise by published date
        const aViews = a.viewCountInt || a.viewCount || 0;
        const bViews = b.viewCountInt || b.viewCount || 0;
        return bViews - aViews;
      })
      .slice(0, 50); // Top 50 most relevant
    
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
    
    // Save to JSON
    writeFileSync(
      'data/videos-shorts.json',
      JSON.stringify(formattedShorts, null, 2)
    );
    
    console.log(`✅ Scraped and filtered ${formattedShorts.length} relevant shorts`);
    console.log(`💾 Saved to data/videos-shorts.json`);
    
    return formattedShorts;
  } catch (error) {
    console.error('Error scraping videos:', error);
    throw error;
  }
}

// Run the scraper
scrapeBoxingLockerShorts();
```

### Store Curated Videos Script (scripts/store-videos.ts)
```typescript
import { sql } from '../lib/db';
import { readFileSync } from 'fs';

async function storeCuratedVideos() {
  const videos = JSON.parse(
    readFileSync('data/videos-shorts.json', 'utf-8')
  );
  
  for (const video of videos) {
    // Extract topic from title/description
    const topic = extractTopic(video.title, video.description);
    const subtopic = extractSubtopic(video.title);
    const tags = extractTags(video.title, video.description);
    
    await sql`
      INSERT INTO video_mapping (
        video_id, video_title, topic, subtopic, tags, created_at
      ) VALUES (
        ${video.id},
        ${video.title},
        ${topic},
        ${subtopic},
        ${tags},
        NOW()
      )
      ON CONFLICT (video_id) DO NOTHING
    `;
  }
  
  console.log(`Stored ${videos.length} videos in database`);
}

function extractTopic(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (text.includes('technique') || text.includes('form')) return 'Technique';
  if (text.includes('tactic') || text.includes('strategy')) return 'Tactics';
  if (text.includes('training') || text.includes('drill')) return 'Training';
  if (text.includes('mindset') || text.includes('mental')) return 'Mindset';
  return 'Technique'; // Default
}

function extractSubtopic(title: string): string {
  const techniques = ['jab', 'cross', 'hook', 'uppercut', 'footwork', 'stance', 'defense'];
  for (const tech of techniques) {
    if (title.toLowerCase().includes(tech)) {
      return tech.charAt(0).toUpperCase() + tech.slice(1);
    }
  }
  return 'General';
}

function extractTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const allTags = ['orthodox', 'southpaw', 'switch', 'power', 'speed', 'range', 'form'];
  return allTags.filter(tag => text.includes(tag));
}
```

### Fetch Curated Videos API (app/api/videos/curated/route.ts)
```typescript
import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const videos = await sql`
    SELECT 
      video_id,
      video_title,
      topic,
      subtopic,
      tags,
      key_timestamps
    FROM video_mapping
    ORDER BY created_at DESC
  `;
  
  return NextResponse.json({ videos });
}
```

### Extract Video References from AI Response
```typescript
export function extractVideoReferences(text: string) {
  // Pattern: "at 2:45", "see 1:15", "watch 3:30"
  const timestampPattern = /(?:at|see|watch|check)\s+(\d+):(\d+)/gi;
  const matches = [...text.matchAll(timestampPattern)];
  
  return matches.map(match => {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return minutes * 60 + seconds; // Convert to total seconds
  });
}
```

---

## Implementation Priority

### MVP (Minimum Viable Product) - Week 1-2
1. ✅ Project setup
2. ✅ Database schema
3. ✅ **Scrape and store curated shorts list (20-50 videos)**
4. ✅ Basic onboarding
5. ✅ Simple coaching form
6. ✅ OpenRouter integration
7. ✅ Basic video player
8. ✅ Use curated video list for AI responses

### Enhanced Features - Week 3-4
1. ✅ Vector database setup
2. ✅ Semantic video search
3. ✅ Advanced video embedding
4. ✅ Stance-aware responses
5. ✅ Session history

### Polish & Optimization - Week 5+
1. ✅ UI/UX refinement
2. ✅ Performance optimization
3. ✅ Error handling
4. ✅ Testing
5. ✅ Documentation

---

**Last Updated**: 2025-10-02
**Status**: Planning Phase

