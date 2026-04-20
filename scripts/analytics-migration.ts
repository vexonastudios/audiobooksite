import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  console.log('Running analytics migration...');

  await sql`
    CREATE TABLE IF NOT EXISTS play_events (
      id             BIGSERIAL PRIMARY KEY,
      audiobook_id   TEXT NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
      session_id     TEXT NOT NULL,
      user_id        TEXT,
      platform       TEXT NOT NULL DEFAULT 'web',
      started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      start_position FLOAT NOT NULL DEFAULT 0
    )
  `;
  console.log('✓ play_events table');

  await sql`
    CREATE TABLE IF NOT EXISTS listen_time (
      id            BIGSERIAL PRIMARY KEY,
      audiobook_id  TEXT NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
      session_id    TEXT NOT NULL,
      user_id       TEXT,
      platform      TEXT NOT NULL DEFAULT 'web',
      listened_secs FLOAT NOT NULL,
      position      FLOAT NOT NULL,
      recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ listen_time table');

  await sql`
    CREATE TABLE IF NOT EXISTS user_listen_stats (
      user_id       TEXT NOT NULL,
      audiobook_id  TEXT NOT NULL REFERENCES audiobooks(id) ON DELETE CASCADE,
      total_secs    FLOAT NOT NULL DEFAULT 0,
      play_count    INT NOT NULL DEFAULT 0,
      last_listened TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      max_position  FLOAT NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, audiobook_id)
    )
  `;
  console.log('✓ user_listen_stats table');

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_play_events_book_time ON play_events(audiobook_id, started_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_play_events_user ON play_events(user_id) WHERE user_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_play_events_started_at ON play_events(started_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listen_time_book_time ON listen_time(audiobook_id, recorded_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listen_time_user ON listen_time(user_id) WHERE user_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_listen_time_recorded_at ON listen_time(recorded_at)`;
  console.log('✓ Indexes created');

  console.log('\n✅ Analytics migration complete!');
}

run().catch(console.error);
