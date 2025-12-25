# The Boxing Locker - AI Coach

> A high-fidelity AI coaching platform featuring Matt Goddard ("The Boxing Locker") - a 7-0 professional boxer and National Champion with 20+ years of ring experience.

## 🎯 What This App Does

**The Boxing Locker** is an AI-powered digital coaching platform that brings Matt Goddard's expertise directly to users through:

- **🤖 AI Chat Coach**: Interactive chat interface powered by Claude 3.5 Sonnet, delivering Matt's technical, British coaching voice with biomechanical insights
- **📹 Video Library**: Curated collection of 600+ boxing technique videos with intelligent search and recommendations
- **📋 Form-Based Coaching**: Structured coaching requests covering Technique, Tactics, Training, and Mindset
- **🎯 Personalised Guidance**: Stance-aware coaching (Orthodox/Southpaw/Switch) tailored to user experience level
- **🔗 Video Integration**: AI automatically recommends relevant videos with specific timestamps for technique demonstrations

## ✨ Key Features

### AI Coaching
- **Personality-Driven Chat**: Matt's signature "no-nonsense" yet motivational coaching style
- **Context-Aware Responses**: Considers user stance, experience level, equipment, and training location
- **Video Recommendations**: Automatically suggests relevant videos from the library
- **Structured Actions**: Provides follow-up buttons for deeper exploration

### Video Library
- **600+ Curated Videos**: Comprehensive collection of boxing techniques, tactics, and training methods
- **Intelligent Search**: Semantic search powered by video metadata and tags
- **Category Organization**: Organized by Technique, Tactics, Training, and Mindset
- **YouTube Integration**: Direct embedding with timestamp support

### Coaching Forms
- **Multi-Step Assessment**: Logic-gated forms that mirror Matt's assessment process
- **Contextual Questions**: Adapts based on selected category and user profile
- **Equipment Awareness**: Considers available equipment and training location

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: OpenRouter API with Claude 3.5 Sonnet
- **Database**: Neon PostgreSQL (serverless)
- **Styling**: Tailwind CSS v4 with custom "Gym Dark" theme
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Video Scraping**: SCRAPECREATORS API
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Neon PostgreSQL database
- OpenRouter API key
- SCRAPECREATORS API key (for video scraping)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GroundCtrlHQ/mattboxing.git
   cd mattboxing
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   
   # AI
   OPENROUTER_API_KEY=sk-or-your-key-here
   
   # Video Scraping
   SCRAPECREATORS_API_KEY=your-api-key-here
   
   # Optional
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database:**
   
   Run the database setup script:
   ```bash
   bun run setup-db
   ```
   
   Or manually run the SQL scripts:
   ```bash
   # Create main tables
   psql $DATABASE_URL < scripts/create-tables.sql
   
   # Add chat tables (if needed)
   psql $DATABASE_URL < scripts/add-chat-tables.sql
   ```

5. **Scrape and store videos:**
   ```bash
   # Scrape videos from The Boxing Locker YouTube channel
   bun run scrape
   
   # Store videos in database
   bun run store
   ```

6. **Run the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── about/             # About Matt page
│   ├── videos/            # Video library page
│   ├── chat/              # AI chat interface
│   ├── coach/             # Form-based coaching
│   └── api/               # API routes
│       ├── chat/          # Chat API endpoint
│       ├── coach/         # Coaching API endpoint
│       └── videos/        # Video search API
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat UI
│   ├── CoachingForm.tsx  # Coaching form component
│   ├── VideoCard.tsx      # Video display card
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility functions
│   ├── db.ts             # Neon database connection
│   ├── openrouter.ts     # OpenRouter API client
│   ├── chat-sessions.ts  # Chat session management
│   └── video-search.ts   # Video search logic
├── scripts/              # Database and scraping scripts
│   ├── create-tables.sql # Database schema
│   ├── scrape-videos.ts  # Video scraper
│   └── store-videos.ts   # Database storage
└── data/                 # Scraped video data (JSON)
```

## 🗄️ Database Schema

### Core Tables

- **`video_mapping`**: Stores video metadata, topics, subtopics, and tags
- **`chat_sessions`**: Manages chat session persistence
- **`chat_messages`**: Stores individual chat messages

See `scripts/create-tables.sql` for the complete schema.

## 🎨 Design System

The app uses a "Gym Dark" theme with:

- **Charcoal Black** (`#0A0A0A`): Primary background
- **Boxing Red** (`#DC2626`): Accent color for actions and highlights
- **Champion Gold** (`#F59E0B`): Premium/achievement indicators

## 🔧 Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run scrape` - Scrape videos from YouTube
- `bun run store` - Store scraped videos in database
- `bun run setup-db` - Set up database tables
- `bun run add-manual` - Add manual video entries
- `bun run recategorize` - Improve video categorization

## 🤖 AI Features

### Matt Goddard Persona

The AI is configured with Matt's:
- **Voice**: British, direct, technical, "no-nonsense" yet motivational
- **Philosophy**: Focus on biomechanics and "Value of Looks"
- **Five Boxing Philosophies**: Brain, Legs, Hands, Heart, Ego
- **Teaching Style**: Step-by-step breakdowns with biomechanical insights

### Video Integration

The AI automatically:
- Searches the video library for relevant content
- Recommends specific videos based on user queries
- Provides follow-up action buttons
- Links to video demonstrations

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI chat |
| `SCRAPECREATORS_API_KEY` | Yes | API key for video scraping |
| `NEXT_PUBLIC_APP_URL` | No | App URL for OpenRouter headers |

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app is optimized for Vercel's serverless environment with Neon's serverless PostgreSQL driver.

## 📚 Documentation

- [PRD.MD](./PRD.MD) - Product requirements document
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - Implementation details
- [ENV_SETUP.md](./ENV_SETUP.md) - Environment setup guide
- [SCRAPECREATORS.md](./SCRAPECREATORS.md) - Video scraping documentation

## 🤝 Contributing

This is a private project for GroundCtrlHQ. For questions or contributions, please contact the maintainers.

## 📄 License

Private - All rights reserved

## 🙏 Acknowledgments

- **Matt Goddard** ("The Boxing Locker") - For the expertise and content
- **OpenRouter** - For AI API access
- **Neon** - For serverless PostgreSQL
- **SCRAPECREATORS** - For video scraping API

---

Built with ❤️ by [GroundCtrl](https://groundctrl.space)
