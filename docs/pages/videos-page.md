# Videos Page

## Purpose
The Videos Page displays Matt Goddard's comprehensive library of 600+ boxing technique videos, allowing users to browse, search, and watch curated content organized by categories and topics.

## Key Features

### Video Library Display
- **Grid Layout**: Responsive grid showing video thumbnails
- **Video Cards**: Each card displays:
  - Video thumbnail
  - Title
  - Topic category badge (Technique, Tactics, Training, Mindset)
  - Subtopic tags
  - View count
  - Published date

### Video Organization
- **Category System**: Videos organized by:
  - **Technique**: Specific boxing techniques (Jab, Cross, Hook, Footwork, etc.)
  - **Tactics**: Strategic scenarios and fight situations
  - **Training**: Workout plans and training methods
  - **Mindset**: Mental preparation and psychology

### Video Player
- **YouTube Integration**: Embedded YouTube player
- **Timestamp Support**: Can start videos at specific timestamps
- **Full-Screen Support**: Standard YouTube player controls
- **Responsive Design**: Adapts to screen size

### Search & Filter
- **Semantic Search**: Intelligent search through video metadata
- **Tag Filtering**: Filter by tags (orthodox, southpaw, power, speed, etc.)
- **Category Filter**: Filter by main category
- **Topic Search**: Search by specific techniques or topics

### Video Metadata
- **Rich Information**: Each video includes:
  - YouTube video ID
  - Title and description
  - Topic and subtopic categorization
  - Tags array for searchability
  - View count and engagement metrics
  - Published timestamp

## Technical Implementation

### Database
- **Table**: `video_mapping` in Neon PostgreSQL
- **Schema**: Stores video metadata, topics, subtopics, and tags
- **Indexing**: Optimized for search queries

### Video Scraping
- **Source**: The Boxing Locker YouTube channel
- **Method**: SCRAPECREATORS API for automated scraping
- **Update Process**: Scripts to add new videos as they're published

### API Integration
- **Search Endpoint**: `/api/videos/search` for semantic search
- **Video Details**: `/api/videos/[videoId]` for individual video data
- **Database Queries**: Efficient SQL queries with proper indexing

## User Experience
- **Fast Loading**: Server-side rendering for quick initial load
- **Infinite Scroll**: (Future) Load more videos as user scrolls
- **Empty State**: Helpful message when no videos are available
- **Mobile Optimized**: Touch-friendly interface on mobile devices

## Integration with Other Features
- **AI Recommendations**: Videos recommended by AI coach appear here
- **Chat Integration**: Chat can link directly to specific videos
- **Coach Integration**: Coaching plans reference videos from this library

## Content Strategy
- **600+ Videos**: Comprehensive library covering all aspects of boxing
- **Regular Updates**: New videos added as Matt publishes content
- **Quality Curation**: Only relevant, high-quality content included
- **Organization**: Clear categorization for easy discovery

## Future Enhancements
- **Playlists**: Curated playlists for specific training goals
- **Progress Tracking**: Track which videos user has watched
- **Favorites**: Save favorite videos for quick access
- **Watch History**: Remember where user left off
- **Video Analytics**: Track which videos are most helpful

