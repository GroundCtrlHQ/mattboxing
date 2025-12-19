# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Neon PostgreSQL Database
# Get your connection string from: https://console.neon.tech
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# SCRAPECREATORS API Key
# Get your API key from: https://scrapecreators.com
SCRAPECREATORS_API_KEY=your_api_key_here

# Optional: OpenRouter API Key (for future AI features)
# OPENROUTER_API_KEY=your_openrouter_key_here

# Optional: YouTube API Key (for future video embedding)
# NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_key_here
```

## Quick Setup

1. **Create `.env.local` file:**
   ```bash
   touch .env.local
   ```

2. **Add your credentials:**
   - Copy the template above
   - Replace `your_api_key_here` with your actual SCRAPECREATORS API key
   - Replace the DATABASE_URL with your Neon connection string

3. **Verify it's working:**
   ```bash
   bun run scrape
   ```

## Getting Your API Keys

### SCRAPECREATORS API Key
1. Sign up at https://scrapecreators.com
2. Navigate to your API keys section
3. Copy your API key

### Neon Database URL
1. Sign up at https://console.neon.tech
2. Create a new project
3. Copy the connection string from the dashboard
4. It should look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

