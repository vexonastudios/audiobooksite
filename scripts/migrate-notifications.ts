import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Creating notifications table...');
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id           VARCHAR(32)  PRIMARY KEY,
      title        VARCHAR(255) NOT NULL,
      body_text    TEXT         NOT NULL,
      audio_url    VARCHAR(512),
      voice_id     VARCHAR(128) NOT NULL DEFAULT 'fnYMz3F5gMEDGMWcH1ex',
      published    BOOLEAN      NOT NULL DEFAULT FALSE,
      expires_at   TIMESTAMPTZ,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ notifications table ready.');
}

migrate().catch(console.error);
