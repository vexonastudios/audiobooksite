/**
 * generateQuoteImage.ts
 * Renders quote images onto HTML5 Canvas and returns an array of PNG data URLs.
 * Long quotes (>350 chars) are automatically split into 2 images (part 1 of 2 / part 2 of 2).
 */

interface QuoteImageOptions {
  quoteText: string;
  bookAuthor: string;
  bookTitle: string;
  chapterTitle?: string;
  bookCoverUrl: string;
}

/** Threshold above which a quote is split across 2 images */
const SPLIT_THRESHOLD = 350;

// ── Helpers ──────────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Draw image scaled to fit (object-fit: contain) — no cropping */
function drawCoverContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgAspect = img.width / img.height;
  const boxAspect = w / h;
  let drawW: number, drawH: number, drawX: number, drawY: number;
  if (imgAspect > boxAspect) {
    drawW = w; drawH = w / imgAspect; drawX = x; drawY = y + (h - drawH) / 2;
  } else {
    drawH = h; drawW = h * imgAspect; drawX = x + (w - drawW) / 2; drawY = y;
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/** Prefix chapterTitle with "Chapter N" if it starts with a bare number */
function formatChapterTitle(raw: string): string {
  const match = raw.match(/^(\d+)\s*[-–—]\s*(.*)$/);
  if (match) return `Chapter ${match[1]} \u2013 ${match[2]}`;
  if (/^\d+$/.test(raw.trim())) return `Chapter ${raw.trim()}`;
  return raw;
}

/**
 * Split a long quote into two roughly-equal halves at a sentence or word boundary.
 * Returns [part1, part2].
 */
function splitQuote(text: string): [string, string] {
  const mid = Math.floor(text.length / 2);

  // Prefer splitting at a sentence end (.!?) near the midpoint
  // Search forward then backward from mid
  const sentenceEnd = /[.!?]["']?\s/g;
  let bestIdx = -1;
  let match: RegExpExecArray | null;

  sentenceEnd.lastIndex = 0;
  while ((match = sentenceEnd.exec(text)) !== null) {
    const idx = match.index + match[0].trimEnd().length;
    if (bestIdx === -1 || Math.abs(idx - mid) < Math.abs(bestIdx - mid)) {
      bestIdx = idx;
    }
  }

  // If no sentence break found, fall back to word boundary near midpoint
  if (bestIdx === -1) {
    const spaceBefore = text.lastIndexOf(' ', mid);
    const spaceAfter = text.indexOf(' ', mid);
    bestIdx = spaceBefore !== -1 ? spaceBefore : spaceAfter !== -1 ? spaceAfter : mid;
  }

  const part1 = text.slice(0, bestIdx).trim();
  const part2 = text.slice(bestIdx).trim();
  return [part1, part2];
}

// ── Core canvas renderer ──────────────────────────────────────────────────────

interface RenderOpts {
  quoteText: string;
  bookAuthor: string;
  bookTitle: string;
  chapterTitle?: string;
  coverImg: HTMLImageElement | null;
  /** Show "(continued…)" below the quote text */
  showContinuedAfter?: boolean;
  /** Show "(continued)" above the quote text */
  showContinuedBefore?: boolean;
  /** Show attribution block (author / title) */
  showAttribution?: boolean;
  /** Part badge text e.g. "1 / 2" */
  partBadge?: string;
}

function renderCanvas(opts: RenderOpts): string {
  const {
    quoteText,
    bookAuthor,
    bookTitle,
    chapterTitle,
    coverImg,
    showContinuedAfter = false,
    showContinuedBefore = false,
    showAttribution = true,
    partBadge,
  } = opts;

  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // ── Background ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#18100c';
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (coverImg) {
    ctx.save();
    ctx.filter = 'blur(50px) brightness(0.18) saturate(1.4)';
    const overflow = 150;
    const scale = Math.max(
      (SIZE + overflow * 2) / coverImg.width,
      (SIZE + overflow * 2) / coverImg.height
    );
    const bw = coverImg.width * scale;
    const bh = coverImg.height * scale;
    ctx.drawImage(coverImg, (SIZE - bw) / 2, (SIZE - bh) / 2, bw, bh);
    ctx.restore();
  }

  // Vignette
  const vigGrad = ctx.createRadialGradient(SIZE/2, SIZE/2, SIZE*0.2, SIZE/2, SIZE/2, SIZE*0.78);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const toneGrad = ctx.createLinearGradient(0, 0, 0, SIZE);
  toneGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
  toneGrad.addColorStop(0.45, 'rgba(0,0,0,0)');
  toneGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = toneGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const PAD = 110;
  const FOOTER_H = showAttribution ? 175 : 120;
  const HEADER_H = 90;
  const contentW = SIZE - PAD * 2;
  const centerX = SIZE / 2;
  const availH = SIZE - FOOTER_H - HEADER_H;

  const CONT_FONT = 19;   // font size for continuation labels
  const CONT_GAP  = 28;   // gap below/above continuation label

  // Font sizing — split quotes use smaller text since each half is shorter
  const len = quoteText.length;
  const quoteFontSize = len > 280 ? 34 : len > 180 ? 40 : len > 100 ? 46 : 54;
  const quoteLineH = quoteFontSize * 1.55;

  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const quoteLines = wrapText(ctx, quoteText, contentW - 20);
  const quoteTotalH = quoteLines.length * quoteLineH;

  // Attribution block height
  const GAP_QUOTE_DIV   = 56;
  const DIV_H           = 1;
  const GAP_DIV_AUTHOR  = 44;
  const AUTHOR_FONT     = 30;
  const GAP_AUTHOR_TITLE = 18;
  const TITLE_FONT      = 21;

  const attrH = showAttribution
    ? GAP_QUOTE_DIV + DIV_H + GAP_DIV_AUTHOR + AUTHOR_FONT + GAP_AUTHOR_TITLE + TITLE_FONT
    : 0;

  const beforeH = showContinuedBefore ? CONT_FONT + CONT_GAP : 0;
  const afterH  = showContinuedAfter  ? CONT_GAP + CONT_FONT : 0;

  const totalBlockH = beforeH + quoteTotalH + afterH + attrH;
  const blockTop = HEADER_H + (availH - totalBlockH) / 2;

  let curY = blockTop;

  // ── "…continued" label above ───────────────────────────────────────────────
  if (showContinuedBefore) {
    ctx.font = `italic ${CONT_FONT}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillText('(continued)', centerX, curY + CONT_FONT);
    curY += CONT_FONT + CONT_GAP;
  }

  // ── Quote text ─────────────────────────────────────────────────────────────
  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 2;

  quoteLines.forEach((line, i) => {
    ctx.fillText(line, centerX, curY + i * quoteLineH + quoteFontSize * 0.85);
  });
  curY += quoteTotalH;

  // ── "continued…" label below ───────────────────────────────────────────────
  if (showContinuedAfter) {
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = `italic ${CONT_FONT}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillText('(continued…)', centerX, curY + CONT_GAP + CONT_FONT);
    curY += CONT_GAP + CONT_FONT;
  }

  // ── Attribution ────────────────────────────────────────────────────────────
  if (showAttribution) {
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    const divY = curY + GAP_QUOTE_DIV;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 90, divY);
    ctx.lineTo(centerX + 90, divY);
    ctx.stroke();

    const authorY = divY + GAP_DIV_AUTHOR + AUTHOR_FONT;
    ctx.font = `bold ${AUTHOR_FONT}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(bookAuthor.toUpperCase(), centerX, authorY);

    ctx.shadowBlur = 0;
    const formattedChapter = chapterTitle ? formatChapterTitle(chapterTitle) : '';
    ctx.font = `italic ${TITLE_FONT}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    const titleY = authorY + GAP_AUTHOR_TITLE + TITLE_FONT;
    ctx.fillText(bookTitle, centerX, titleY);

    if (formattedChapter) {
      ctx.font = `${TITLE_FONT - 3}px Georgia, serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.fillText(formattedChapter, centerX, titleY + TITLE_FONT + 10);
    }
  }

  // ── Book cover thumbnail (bottom-right) ─────────────────────────────────────
  const COVER_W = 126;
  const COVER_H = 189;
  const COVER_X = SIZE - PAD - COVER_W;
  const COVER_Y = SIZE - 54 - COVER_H;

  if (coverImg) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 8);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();

    ctx.save();
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 8);
    ctx.clip();
    drawCoverContain(ctx, coverImg, COVER_X, COVER_Y, COVER_W, COVER_H);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 8);
    ctx.stroke();
  }

  // ── Branding (bottom-left) ─────────────────────────────────────────────────
  const brand = 'SCROLLREADER.COM';
  const BRAND_FONT_SIZE = 26;
  ctx.font = `bold ${BRAND_FONT_SIZE}px Georgia, serif`;
  const brandW = ctx.measureText(brand).width;
  const bpad = 22;
  const boxH = 50;
  const boxX = PAD;
  const boxY = SIZE - 52 - boxH;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const labelText = 'AUDIOBOOKS & BOOKS';
  ctx.font = `13px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const letterSpacing = 2.5;
  let lx = boxX;
  for (const ch of labelText) {
    ctx.fillText(ch, lx, boxY - 14);
    lx += ctx.measureText(ch).width + letterSpacing;
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.50)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, brandW + bpad * 2, boxH);

  ctx.font = `bold ${BRAND_FONT_SIZE}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand, boxX + bpad, boxY + boxH / 2);

  // ── Part badge (top-right) ─────────────────────────────────────────────────
  if (partBadge) {
    const badgeText = partBadge;
    ctx.font = `bold 20px Georgia, serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillText(badgeText, SIZE - PAD, HEADER_H / 2 + 4);
  }

  return canvas.toDataURL('image/png', 1.0);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate one or two quote images.
 * Returns an array of PNG data URLs. Long quotes (>350 chars) produce 2 images.
 */
export async function generateQuoteImage(opts: QuoteImageOptions): Promise<string[]> {
  const { quoteText, bookAuthor, bookTitle, chapterTitle, bookCoverUrl } = opts;

  // Load cover image (try original uncropped WP file first)
  const originalUrl = bookCoverUrl
    ? bookCoverUrl.replace(/-\d+x\d+(?=\.[a-zA-Z]+$)/, '')
    : '';
  const proxyUrl  = bookCoverUrl ? `/api/image-proxy?url=${encodeURIComponent(bookCoverUrl)}` : null;
  const proxyOrig = originalUrl && originalUrl !== bookCoverUrl
    ? `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`
    : null;

  let coverImg: HTMLImageElement | null = null;
  if (proxyOrig) { try { coverImg = await loadImage(proxyOrig); } catch { /* fall through */ } }
  if (!coverImg && proxyUrl) { try { coverImg = await loadImage(proxyUrl); } catch { /* no cover */ } }

  const shared = { bookAuthor, bookTitle, chapterTitle, coverImg };

  // ── Single image for short quotes ─────────────────────────────────────────
  if (quoteText.length <= SPLIT_THRESHOLD) {
    const dataUrl = renderCanvas({
      quoteText,
      ...shared,
      showAttribution: true,
    });
    return [dataUrl];
  }

  // ── Two images for long quotes ─────────────────────────────────────────────
  const [part1, part2] = splitQuote(quoteText);

  const img1 = renderCanvas({
    quoteText: part1,
    ...shared,
    showAttribution: false,
    showContinuedAfter: true,
    partBadge: '1 / 2',
  });

  const img2 = renderCanvas({
    quoteText: part2,
    ...shared,
    showAttribution: true,
    showContinuedBefore: true,
    partBadge: '2 / 2',
  });

  return [img1, img2];
}
