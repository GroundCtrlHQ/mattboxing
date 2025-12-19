-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension (for future semantic search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Video Mapping Table (stores curated shorts)
CREATE TABLE IF NOT EXISTS video_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(255) UNIQUE NOT NULL,
  video_title VARCHAR(500) NOT NULL,
  topic VARCHAR(50), -- Technique/Tactics/Training/Mindset
  subtopic VARCHAR(100), -- e.g., "Jab", "Footwork", "Stance"
  tags TEXT[], -- Array of keywords
  url TEXT,
  thumbnail TEXT,
  view_count INTEGER DEFAULT 0,
  published_time TIMESTAMP,
  key_timestamps JSONB DEFAULT '[]'::jsonb, -- Array of {timestamp: number, description: string}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on video_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_video_mapping_video_id ON video_mapping(video_id);

-- Create index on topic and subtopic for filtering
CREATE INDEX IF NOT EXISTS idx_video_mapping_topic ON video_mapping(topic);
CREATE INDEX IF NOT EXISTS idx_video_mapping_subtopic ON video_mapping(subtopic);

-- Create GIN index on tags for array searches
CREATE INDEX IF NOT EXISTS idx_video_mapping_tags ON video_mapping USING GIN(tags);

-- Video Embeddings Table (for future semantic search)
CREATE TABLE IF NOT EXISTS video_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id VARCHAR(255) UNIQUE NOT NULL REFERENCES video_mapping(video_id),
  video_title VARCHAR(500),
  video_description TEXT,
  topic VARCHAR(50),
  subtopic VARCHAR(100),
  key_timestamps JSONB DEFAULT '[]'::jsonb,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector index for similarity search (will be created after embeddings are added)
-- CREATE INDEX ON video_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_mapping_updated_at BEFORE UPDATE ON video_mapping
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

