-- ScrollReader CMS — Neon Postgres Schema
-- Run this in the Neon SQL Editor: https://console.neon.tech

CREATE TABLE IF NOT EXISTS audiobooks (
  id              TEXT PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  excerpt         TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  pub_date        TIMESTAMPTZ DEFAULT now(),
  author_name     TEXT NOT NULL DEFAULT '',
  cover_image     TEXT DEFAULT '',
  thumbnail_url   TEXT DEFAULT '',
  mp3_url         TEXT DEFAULT '',
  mp3_url_low     TEXT DEFAULT '',
  total_duration  TEXT DEFAULT '',
  length_str      TEXT DEFAULT '',
  duration_secs   INT DEFAULT 0,
  original_year   INT,
  youtube_link    TEXT,
  spotify_link    TEXT,
  buy_link        TEXT,
  generated_colors TEXT,
  plays           INT DEFAULT 0,
  published       BOOLEAN DEFAULT true,
  categories      TEXT[] DEFAULT '{}',
  topics          TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id              SERIAL PRIMARY KEY,
  audiobook_id    TEXT REFERENCES audiobooks(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '',
  start_time      INT NOT NULL DEFAULT 0,
  duration        INT,
  sort_order      INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chapters_audiobook ON chapters(audiobook_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON audiobooks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON audiobooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
