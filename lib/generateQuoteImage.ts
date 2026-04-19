/**
 * generateQuoteImage.ts
 * Renders a quote image directly onto an HTML5 Canvas and returns a PNG data URL.
 */

interface QuoteImageOptions {
  quoteText: string;
  bookAuthor: string;
  bookTitle: string;
  chapterTitle?: string;
  bookCoverUrl: string;
}

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

/** Draw image with object-fit: cover behaviour */
function drawCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgAspect = img.width / img.height;
  const boxAspect = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (imgAspect > boxAspect) {
    // Image is wider than box — crop sides
    sw = img.height * boxAspect;
    sx = (img.width - sw) / 2;
  } else {
    // Image is taller than box — crop top/bottom
    sh = img.width / boxAspect;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** Prefix chapterTitle with "Chapter N" if it starts with a bare number */
function formatChapterTitle(raw: string): string {
  // e.g. "16 - The Problem..." → "Chapter 16 – The Problem..."
  const match = raw.match(/^(\d+)\s*[-–—]\s*(.*)$/);
  if (match) return `Chapter ${match[1]} \u2013 ${match[2]}`;
  // e.g. "16" alone
  if (/^\d+$/.test(raw.trim())) return `Chapter ${raw.trim()}`;
  return raw;
}

export async function generateQuoteImage(opts: QuoteImageOptions): Promise<string> {
  const { quoteText, bookAuthor, bookTitle, chapterTitle, bookCoverUrl } = opts;

  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // ── 1. Load cover via proxy ────────────────────────────────────────────────
  const proxyUrl = bookCoverUrl
    ? `/api/image-proxy?url=${encodeURIComponent(bookCoverUrl)}`
    : null;

  let coverImg: HTMLImageElement | null = null;
  if (proxyUrl) {
    try { coverImg = await loadImage(proxyUrl); } catch { /* fallback to dark bg */ }
  }

  // ── 2. Dark base fill ────────────────────────────────────────────────────
  ctx.fillStyle = '#18100c';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 3. Blurred background ────────────────────────────────────────────────
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

  // ── 4. Vignette ──────────────────────────────────────────────────────────
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

  // ── 5. Layout constants ────────────────────────────────────────────────────
  const PAD = 110;
  // Footer: reserve 175px at the bottom for cover + branding
  const FOOTER_H = 175;
  const HEADER_H = 90;
  const contentW = SIZE - PAD * 2;
  const centerX = SIZE / 2;
  const availH = SIZE - FOOTER_H - HEADER_H;

  // ── 6. Font sizing ────────────────────────────────────────────────────────
  const len = quoteText.length;
  const quoteFontSize = len > 280 ? 34 : len > 180 ? 40 : len > 100 ? 46 : 54;
  const quoteLineH = quoteFontSize * 1.55;

  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const quoteLines = wrapText(ctx, quoteText, contentW - 20);
  const quoteTotalH = quoteLines.length * quoteLineH;

  // Block: quoteText + gap + divider + gap + author + gap + title
  const GAP_QUOTE_DIV  = 56;
  const DIV_H          = 1;
  const GAP_DIV_AUTHOR = 44;
  const AUTHOR_FONT    = 30;
  const GAP_AUTHOR_TITLE = 18;
  const TITLE_FONT     = 21;

  const totalBlockH =
    quoteTotalH +
    GAP_QUOTE_DIV + DIV_H + GAP_DIV_AUTHOR +
    AUTHOR_FONT + GAP_AUTHOR_TITLE + TITLE_FONT;

  const blockTop = HEADER_H + (availH - totalBlockH) / 2;

  // ── 7. Quote text ──────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 2;
  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;

  quoteLines.forEach((line, i) => {
    ctx.fillText(line, centerX, blockTop + i * quoteLineH + quoteFontSize * 0.85);
  });
  const quoteEndY = blockTop + quoteTotalH;

  // ── 8. Thin divider line ───────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const divY = quoteEndY + GAP_QUOTE_DIV;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 90, divY);
  ctx.lineTo(centerX + 90, divY);
  ctx.stroke();

  // ── 9. Author name ─────────────────────────────────────────────────────────
  const authorY = divY + GAP_DIV_AUTHOR + AUTHOR_FONT;
  ctx.font = `bold ${AUTHOR_FONT}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(bookAuthor.toUpperCase(), centerX, authorY);

  // ── 10. Book title + chapter ───────────────────────────────────────────────
  ctx.shadowBlur = 0;
  const formattedChapter = chapterTitle ? formatChapterTitle(chapterTitle) : '';
  // Title line: "Book Title" alone, then chapter on next line if present
  ctx.font = `italic ${TITLE_FONT}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  const titleY = authorY + GAP_AUTHOR_TITLE + TITLE_FONT;
  ctx.fillText(bookTitle, centerX, titleY);

  if (formattedChapter) {
    ctx.font = `${TITLE_FONT - 3}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.fillText(formattedChapter, centerX, titleY + TITLE_FONT + 10);
  }

  // ── 11. Book cover thumbnail (bottom-right) ────────────────────────────────
  const COVER_W = 118;
  const COVER_H = 178;   // 2:3 portrait — proper book ratio
  const COVER_X = SIZE - PAD - COVER_W;
  const COVER_Y = SIZE - 56 - COVER_H;

  if (coverImg) {
    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 7);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Clipped cover with proper object-fit:cover
    ctx.save();
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 7);
    ctx.clip();
    drawCoverFit(ctx, coverImg, COVER_X, COVER_Y, COVER_W, COVER_H);
    ctx.restore();

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 7);
    ctx.stroke();
  }

  // ── 12. Branding (bottom-left corner) ─────────────────────────────────────
  const brand = 'SCROLLREADER.COM';
  ctx.font = `bold 22px Georgia, serif`;
  const brandMetrics = ctx.measureText(brand);
  const brandW = brandMetrics.width;
  const bpad = 18;
  const boxH = 44;
  const boxX = PAD;
  // Pin to bottom: same baseline as cover bottom
  const boxY = SIZE - 56 - boxH;

  // "AUDIOBOOKS & BOOKS" label above box
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = `12px Georgia, serif`;
  ctx.fillText('AUDIOBOOKS & BOOKS', boxX, boxY - 12);

  // Brand box
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 1.5;
  clipRoundedRect(ctx, boxX, boxY, brandW + bpad * 2, boxH, 6);
  ctx.stroke();
  ctx.font = `bold 22px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillText(brand, boxX + bpad, boxY + boxH - 13);

  return canvas.toDataURL('image/png', 1.0);
}
