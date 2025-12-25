import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const faqPath = join(process.cwd(), 'MATT_GODDARD_FAQ.md');
    const faqContent = readFileSync(faqPath, 'utf-8');
    
    // Return first 8000 characters to avoid token limits
    return NextResponse.json({ 
      content: faqContent.substring(0, 8000) 
    });
  } catch (error: any) {
    console.error('[Voice] FAQ error:', error);
    return NextResponse.json(
      { error: 'Failed to load FAQ' },
      { status: 500 }
    );
  }
}

