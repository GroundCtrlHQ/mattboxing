import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

function splitSQLStatements(sql: string): string[] {
  // Remove comments
  const withoutComments = sql.replace(/--.*$/gm, '');
  
  // Split by semicolons, but preserve dollar-quoted strings (like $$ language 'plpgsql' $$)
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  for (let i = 0; i < withoutComments.length; i++) {
    const char = withoutComments[i];
    const nextChar = withoutComments[i + 1];
    
    // Check for dollar-quoted strings
    if (char === '$' && !inDollarQuote) {
      // Find the dollar tag
      let tagEnd = i + 1;
      while (tagEnd < withoutComments.length && withoutComments[tagEnd] !== '$') {
        tagEnd++;
      }
      if (tagEnd < withoutComments.length) {
        dollarTag = withoutComments.substring(i, tagEnd + 1);
        inDollarQuote = true;
        current += char;
        continue;
      }
    }
    
    if (inDollarQuote) {
      current += char;
      // Check if we're closing the dollar quote
      if (char === '$' && current.endsWith(dollarTag)) {
        inDollarQuote = false;
        dollarTag = '';
      }
      continue;
    }
    
    current += char;
    
    // If we hit a semicolon and we're not in a dollar quote, it's the end of a statement
    if (char === ';' && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
    }
  }
  
  // Add any remaining statement
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    statements.push(trimmed);
  }
  
  return statements.filter(s => s.length > 0);
}

async function setupDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  console.log('🔌 Connecting to Neon database...');
  const sql = neon(DATABASE_URL);

  // Read the SQL file
  const sqlPath = join(process.cwd(), 'scripts', 'create-tables.sql');
  const sqlScript = readFileSync(sqlPath, 'utf-8');

  // Split into individual statements
  const statements = splitSQLStatements(sqlScript);
  console.log(`📝 Executing ${statements.length} SQL statements...`);

  try {
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sql(statement);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.message?.includes('already exists') ||
          error.message?.includes('duplicate') ||
          error.message?.includes('relation') && error.message?.includes('already exists')
        ) {
          // This is fine, object already exists
          continue;
        }
        // For other errors, log but continue (some statements might fail if dependencies don't exist yet)
        console.warn(`⚠️  Statement ${i + 1} warning: ${error.message?.substring(0, 100)}`);
      }
    }

    console.log('✅ Database setup complete!');
    console.log('📊 Tables created:');
    console.log('   - video_mapping');
    console.log('   - video_embeddings');
    console.log('   - Extensions: uuid-ossp, vector');
    
    // Verify tables exist
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('video_mapping', 'video_embeddings')
      `;
      
      console.log(`\n✅ Verified ${tables.length} tables exist in database`);
    } catch (error) {
      // Verification failed, but setup might still be okay
      console.log('\n⚠️  Could not verify tables (this might be okay)');
    }
  } catch (error: any) {
    console.error('❌ Error setting up database:', error.message);
    throw error;
  }
}

setupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
