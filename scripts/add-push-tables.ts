import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id    TEXT NOT NULL,
      fcm_token  TEXT NOT NULL,
      platform   TEXT NOT NULL DEFAULT 'web',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(fcm_token)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_push_sub_user ON push_subscriptions(user_id)`;
  console.log('✓ push_subscriptions table ready');

  await sql`
    CREATE TABLE IF NOT EXISTS push_log (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title       TEXT NOT NULL,
      body        TEXT NOT NULL,
      link        TEXT,
      trigger     TEXT NOT NULL DEFAULT 'manual',
      sent_count  INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ push_log table ready');
  console.log('Migration complete!');
}

migrate().catch(console.error);
