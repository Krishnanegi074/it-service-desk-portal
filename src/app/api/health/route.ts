import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export async function GET() {
  const isPostgresConfigured = Boolean(process.env.DATABASE_URL);
  
  try {
    if (isPostgresConfigured) {
      await initDatabase();
    }
    return NextResponse.json({
      status: 'ok',
      storage: isPostgresConfigured ? 'postgresql' : 'in-memory',
      databaseUrlConfigured: isPostgresConfigured,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      storage: 'postgresql-failed',
      error: (error as Error).message
    }, { status: 500 });
  }
}
