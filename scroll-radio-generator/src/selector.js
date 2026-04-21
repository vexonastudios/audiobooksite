// src/selector.js
// Picks a sequence of chapters that fills the target duration.
// Rules:
//   - No chapter appears twice in the same block
//   - No more than MAX_CONSECUTIVE_SAME_BOOK chapters from the same book in a row
//   - Prefer variety across different books
//   - Shuffles randomly each run so every block is unique

/**
 * @param {Array} library - result from db.fetchLibrary()
 * @param {number} targetSecs - total target audio duration in seconds
 * @param {number} bumperSecs - approximate duration of each bumper (padding)
 * @returns {Array} ordered list of { book, chapter } objects
 */
export function selectChapters(library, targetSecs, bumperSecs = 20) {
  const maxConsecutive = Number(process.env.MAX_CONSECUTIVE_SAME_BOOK ?? 2);

  // Flatten all chapters into a pool with their parent book attached
  const pool = [];
  for (const book of library) {
    for (const chapter of book.chapters) {
      pool.push({ book, chapter });
    }
  }

  // Shuffle the pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = [];
  const usedChapterKeys = new Set(); // bookId:chapterTitle — prevent repeats
  let totalAudio = 0;
  let lastBookId = null;
  let consecutiveCount = 0;

  for (const item of pool) {
    if (totalAudio >= targetSecs) break;

    const key = `${item.book.id}:${item.chapter.title}`;
    if (usedChapterKeys.has(key)) continue;

    // Enforce max-consecutive-same-book rule
    if (item.book.id === lastBookId) {
      if (consecutiveCount >= maxConsecutive) continue;
      consecutiveCount++;
    } else {
      consecutiveCount = 1;
    }

    // Account for the bumper that will go before this chapter
    const chapterContribution = item.chapter.duration + bumperSecs;
    if (totalAudio + chapterContribution > targetSecs + bumperSecs * 3) continue; // small overflow tolerance

    selected.push(item);
    usedChapterKeys.add(key);
    totalAudio += chapterContribution;
    lastBookId = item.book.id;
  }

  const totalMins = Math.round(totalAudio / 60);
  console.log(`🎲 Selected ${selected.length} chapters (~${totalMins} min of audio)`);

  if (selected.length === 0) {
    throw new Error('Could not select any chapters. Check MIN_CHAPTER_SECS and library size.');
  }

  return selected;
}
