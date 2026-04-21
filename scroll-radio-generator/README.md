# 📻 Scroll Radio — Block Generator

Local tool that generates **Now Playing** radio blocks for ScrollReader.

Runs entirely on your desktop. Produces a ~2-hour MP3 + JSON manifest, then uploads both to Cloudflare R2.

---

## Prerequisites

**Node.js 18+**

**ffmpeg + ffprobe** — must be available on PATH.
- Download from https://ffmpeg.org/download.html
- Windows: grab a build from https://www.gyan.dev/ffmpeg/builds/ → extract → add the `bin/` folder to your system PATH

Verify with:
```
ffmpeg -version
ffprobe -version
```

---

## Setup

```bash
cd scroll-radio-generator
npm install
cp .env.example .env
# Fill in .env with your real credentials
```

### .env values you need

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Neon dashboard → your project → Connection String |
| `ELEVENLABS_API_KEY` | ElevenLabs dashboard → Profile → API Keys |
| `ELEVENLABS_VOICE_ID` | ElevenLabs dashboard → Voices → click a voice → copy ID |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 → Account ID (top right) |
| `R2_ACCESS_KEY_ID` | Cloudflare → R2 → Manage API Tokens → Create API Token |
| `R2_SECRET_ACCESS_KEY` | Same token creation (only shown once) |
| `R2_BUCKET_NAME` | Your R2 bucket name (e.g. `scrollreader-audio`) |
| `R2_PUBLIC_DOMAIN` | Your R2 custom domain (e.g. `https://audio.scrollreader.com`) |

---

## Usage

### Dry run (preview chapter selection — no API calls)
```bash
node generate.js --dry-run
```

This shows you exactly which chapters will be in the block without spending any ElevenLabs credits or touching R2.

### Generate a full block
```bash
node generate.js
```

Takes roughly **15–30 minutes** depending on how many chapters are selected and your internet speed.

Progress is printed step by step:
```
📻  Scroll Radio — Block Generator
📚 Fetching library from database...
   Found 87 books with 412 eligible chapters.
🎲 Selected 24 chapters (~118 min of audio)

📋 Block plan:
    1. [18m 32s] "Chapter 3 — The Way of Prayer" — The Path of Prayer
    2. [12m 14s] "The Man of Faith" — Hudson Taylor's Spiritual Secret
   ...

🎙️  [1/24] Generating bumper via ElevenLabs...
✂️   [1/24] Extracting "Chapter 3 — The Way of Prayer" (18m 32s) via ffmpeg...
...
🔧 Stitching 49 clips into final MP3...
☁️  Uploading to Cloudflare R2...

✅  Block generated successfully!
  ID:       radio-2025-06-09-1430
  Duration: 2h 3m 14s
  Chapters: 24
  MP3:      https://audio.scrollreader.com/radio/radio-2025-06-09-1430.mp3
  Manifest: https://audio.scrollreader.com/radio/radio-2025-06-09-1430.manifest.json
```

---

## Output files

After a run, `output/` contains:
```
radio-2025-06-09-1430.mp3              ← the full radio block (uploaded to R2)
radio-2025-06-09-1430.manifest.json   ← track listing with timed offsets (uploaded to R2)
radio-2025-06-09-1430.summary.json    ← local summary with all URLs
```

The `temp/` folder is automatically cleaned up after each run.

---

## How the "Now Playing" sync works

The manifest has a `broadcastStartTime` field (set `null` by default — filled in by the admin when scheduling). When a user opens the ScrollReader app:

```
currentOffset = (Date.now() - broadcastStartTime) % totalDuration
```

The player seeks to that offset — every listener hears the **same second of audio** at the same time. When the block ends, it loops back to the start automatically.

---

## Tuning settings (.env)

| Variable | Default | Description |
|---|---|---|
| `TARGET_DURATION_SECS` | `7200` | ~2 hours |
| `MIN_CHAPTER_SECS` | `300` | Skip chapters < 5 min |
| `MAX_CONSECUTIVE_SAME_BOOK` | `2` | Max same-book chapters in a row |

---

## File structure

```
scroll-radio-generator/
├── generate.js          ← Main script — start here
├── package.json
├── .env                 ← Your secrets (never commit this)
├── .env.example         ← Template
├── src/
│   ├── db.js            ← Neon DB queries
│   ├── selector.js      ← Chapter randomization logic
│   ├── elevenlabs.js    ← TTS bumper generation
│   ├── extractor.js     ← ffmpeg chapter extraction
│   ├── stitcher.js      ← ffmpeg concatenation
│   ├── manifest.js      ← JSON track manifest builder
│   └── uploader.js      ← Cloudflare R2 upload
├── temp/                ← Working files (auto-cleaned)
└── output/              ← Final outputs (kept locally)
```
