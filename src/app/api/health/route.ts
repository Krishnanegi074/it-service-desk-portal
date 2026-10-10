import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { inspectEnvironment } from '@/lib/environment';

export async function GET() {
  const isPostgresConfigured = Boolean(process.env.DATABASE_URL);
  const environment = inspectEnvironment();
  
  try {
    if (isPostgresConfigured) {
      await initDatabase();
    }
    return NextResponse.json({
      status: environment.ready ? 'ok' : 'degraded',
      environment: environment.environment,
      version: environment.version,
      storage: isPostgresConfigured ? 'postgresql' : 'in-memory',
      services: environment.services,
      configurationErrors: environment.errors,
      configurationWarnings: environment.warnings,
      timestamp: new Date().toISOString()
    }, { status: environment.ready ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      storage: 'postgresql-failed',
      error: (error as Error).message
    }, { status: 500 });
  }
}
