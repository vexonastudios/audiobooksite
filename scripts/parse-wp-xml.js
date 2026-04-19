/**
 * WordPress XML → JSON Parser for ScrollReader
 * Run: node scripts/parse-wp-xml.js
 *
 * Reads:  scrollreader.WordPress.2026-04-19.xml (root dir)
 * Writes: public/data/audiobooks.json
 *         public/data/articles.json
 *
 * Detects audiobooks by the presence of `audiobook_mp3_link` postmeta.
 * Everything else with a cover image and wp_page_template != single-audiobook
 * is treated as an article.
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// ── 1. Locate XML ─────────────────────────────────────────────────────────────
const XML_DIR = path.resolve(__dirname, '..');
const xmlFiles = fs.readdirSync(XML_DIR).filter(f => f.endsWith('.xml'));
if (!xmlFiles.length) {
  console.error('❌  No .xml file found in project root.');
  process.exit(1);
}
const xmlPath = path.join(XML_DIR, xmlFiles[0]);
console.log(`📖  Parsing: ${xmlFiles[0]}`);

// ── 2. Parse XML ──────────────────────────────────────────────────────────────
const raw = fs.readFileSync(xmlPath, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataTagName: '__cdata',
  cdataPositionChar: '\\c',
  parseTagValue: true,
  trimValues: true,
  processEntities: true,
  // Keep arrays for elements that repeat
  isArray: (name) =>
    ['item', 'wp:postmeta', 'category', 'wp:author'].includes(name),
});
const doc = parser.parse(raw);
const channel = doc.rss.channel;

// ── 3. Build author login → display_name map ─────────────────────────────────
const authorMap = {};
(channel['wp:author'] || []).forEach((a) => {
  const login = a['wp:author_login']?.['__cdata'] ?? a['wp:author_login'];
  const name = a['wp:author_display_name']?.['__cdata'] ?? a['wp:author_display_name'];
  if (login && name) authorMap[login] = name;
});

// ── 4. Helper: extract meta value by key ────────────────────────────────────
function getMeta(metas, key) {
  if (!Array.isArray(metas)) return '';
  const m = metas.find((m) => {
    const k = m['wp:meta_key']?.['__cdata'] ?? m['wp:meta_key'];
    return k === key;
  });
  if (!m) return '';
  const v = m['wp:meta_value']?.['__cdata'] ?? m['wp:meta_value'];
  return v ?? '';
}

// ── 5. Parse chapter timestamp string into structured objects ─────────────────
// Format: "(H:MM:SS) Title - Duration: M:SS\n(H:MM:SS) ..."
// OR:     "(M:SS) Title - Duration: M:SS\n..."
function parseTimestamps(raw) {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.map((line) => {
    // Capture start timestamp (e.g., (0:00) or (1:17:33))
    const match = line.match(/^\((\d+:\d{2}(?::\d{2})?)\)\s+(.+?)(?:\s+-\s+Duration:\s*(\d+:\d{2}(?::\d{2})?))?$/);
    if (!match) return null;

    const [, startStr, title, durationStr] = match;
    return {
      title: title.trim(),
      startTime: hhmmssToSeconds(startStr),
      duration: durationStr ? hhmmssToSeconds(durationStr) : null,
    };
  }).filter(Boolean);
}

function hhmmssToSeconds(str) {
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// ── 6. Classify and transform items ──────────────────────────────────────────
const audiobooks = [];
const articles = [];

const items = Array.isArray(channel.item) ? channel.item : [channel.item];

items.forEach((item) => {
  // Skip non-published posts
  const status = item['wp:status']?.['__cdata'] ?? item['wp:status'];
  if (status !== 'publish') return;

  const postType = item['wp:post_type']?.['__cdata'] ?? item['wp:post_type'];
  if (postType !== 'post') return;

  const metas = item['wp:postmeta'] || [];
  const template = getMeta(metas, '_wp_page_template');
  const mp3Url = getMeta(metas, 'audiobook_mp3_link');

  // Use template or mp3url presence to determine type
  const isAudiobook = template === 'single-audiobook.php' || !!mp3Url;

  // ── Common fields ──────────────────────────────────────────────────────
  const id = String(item['wp:post_id']);
  const titleRaw = item.title?.['__cdata'] ?? item.title ?? '';
  const slugRaw = item['wp:post_name']?.['__cdata'] ?? item['wp:post_name'] ?? '';
  const pubDate = item['wp:post_date']?.['__cdata'] ?? item['wp:post_date'] ?? '';
  const creatorLogin = item['dc:creator']?.['__cdata'] ?? item['dc:creator'] ?? '';
  const authorName = authorMap[creatorLogin] || creatorLogin || 'Unknown';
  const description = item['content:encoded']?.['__cdata'] ?? item['content:encoded'] ?? '';
  const excerpt = item['excerpt:encoded']?.['__cdata'] ?? item['excerpt:encoded'] ?? '';
  const coverImage = getMeta(metas, '_audiobook_cover_image');

  // Categories & topics
  const rawCats = Array.isArray(item.category) ? item.category : item.category ? [item.category] : [];
  const categories = rawCats
    .filter(c => (c['@_domain'] === 'category'))
    .map(c => c['__cdata'] || c['#text'] || c)
    .filter(Boolean);
  const topics = rawCats
    .filter(c => (c['@_domain'] === 'topic'))
    .map(c => c['__cdata'] || c['#text'] || c)
    .filter(Boolean);

  if (isAudiobook) {
    // Aggregate monthly play counts
    const playKeys = metas
      .filter(m => {
        const k = m['wp:meta_key']?.['__cdata'] ?? m['wp:meta_key'];
        return k && k.startsWith('audio_plays_');
      })
      .map(m => parseInt((m['wp:meta_value']?.['__cdata'] ?? m['wp:meta_value']) || '0', 10));
    const totalPlays = parseInt(getMeta(metas, 'audio_plays') || '0', 10)
      + playKeys.reduce((a, b) => a + b, 0);

    const chapterRaw = getMeta(metas, 'audiobook_chapter_timestamps');
    const chapters = parseTimestamps(chapterRaw);

    audiobooks.push({
      id,
      slug: slugRaw,
      title: titleRaw,
      excerpt,
      description,
      pubDate,
      authorName,
      coverImage,
      thumbnailUrl: coverImage, // same URL; app can resize via query params if needed
      categories,
      topics,
      mp3Url,
      totalDuration: getMeta(metas, 'audiobook_total_duration'),
      length: getMeta(metas, 'audiobook_length'),
      originalYear: getMeta(metas, 'original_year'),
      youtubeLink: getMeta(metas, 'audiobook_youtube_link') || null,
      spotifyLink: getMeta(metas, 'audiobook_spotify_link') || null,
      buyLink: getMeta(metas, 'audiobook_buy_link') || null,
      generatedColors: getMeta(metas, '_generated_colors') || null,
      plays: totalPlays,
      chapters,
    });
  } else {
    articles.push({
      id,
      slug: slugRaw,
      title: titleRaw,
      excerpt,
      description,
      pubDate,
      authorName,
      coverImage,
      categories,
      topics,
    });
  }
});

// ── 7. Write output ───────────────────────────────────────────────────────────
const dataDir = path.resolve(__dirname, '../public/data');
fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(path.join(dataDir, 'audiobooks.json'), JSON.stringify(audiobooks, null, 2));
fs.writeFileSync(path.join(dataDir, 'articles.json'), JSON.stringify(articles, null, 2));

console.log(`✅  Parsed ${audiobooks.length} audiobooks → public/data/audiobooks.json`);
console.log(`✅  Parsed ${articles.length} articles   → public/data/articles.json`);
