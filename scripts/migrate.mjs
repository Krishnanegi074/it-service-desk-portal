import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

async function main() {
  if (!process.env.DATABASE_URL && existsSync('.env.local') && process.loadEnvFile) {
    process.loadEnvFile('.env.local');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Add it to .env.local or the command environment.');
  }

  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const migrationsDirectory = path.join(process.cwd(), 'migrations');
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const filename of files) {
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [filename]
      );

      if (existing.rowCount) {
        console.log(`Skipped ${filename} (already applied)`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDirectory, filename), 'utf8');
      await client.query('BEGIN');

      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`Applied ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Migration failed: ${message}`);
  process.exitCode = 1;
});
