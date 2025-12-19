import { neon } from '@neondatabase/serverless';

/**
 * Get Neon database connection
 * Follows Neon's recommended pattern for Next.js Server Components and Server Actions
 */
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }
  return neon(process.env.DATABASE_URL);
}

// Export a singleton instance for convenience in Server Components
export const sql = getDb();

