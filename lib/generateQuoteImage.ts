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
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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

export async function generateQuoteImage(opts: QuoteImageOptions): Promise<string> {
  const { quoteText, bookAuthor, bookTitle, chapterTitle, bookCoverUrl } = opts;

  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  // ── 1. Load cover image via proxy ──────────────────────────────────────────
  const proxyUrl = bookCoverUrl
    ? `/api/image-proxy?url=${encodeURIComponent(bookCoverUrl)}`
    : null;

  let coverImg: HTMLImageElement | null = null;
  if (proxyUrl) {
    try { coverImg = await loadImage(proxyUrl); } catch { /* fallback */ }
  }

  // ── 2. Dark base fill ──────────────────────────────────────────────────────
  ctx.fillStyle = '#18100c';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 3. Blurred background image ────────────────────────────────────────────
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

  // ── 4. Vignette overlay (edges dark, center lighter) ───────────────────────
  const vigGrad = ctx.createRadialGradient(SIZE/2, SIZE/2, SIZE*0.2, SIZE/2, SIZE/2, SIZE*0.75);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Also a subtle tonal gradient top→bottom
  const toneGrad = ctx.createLinearGradient(0, 0, 0, SIZE);
  toneGrad.addColorStop(0, 'rgba(0,0,0,0.15)');
  toneGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
  toneGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = toneGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ── 5. Layout constants ────────────────────────────────────────────────────
  const PAD = 110;           // horizontal padding
  const FOOTER_H = 180;      // reserved footer zone height
  const HEADER_H = 80;       // clear top margin
  const contentW = SIZE - PAD * 2;
  const centerX = SIZE / 2;
  const availH = SIZE - FOOTER_H - HEADER_H;   // zone for quote block

  // ── 6. Font sizing ─────────────────────────────────────────────────────────
  const len = quoteText.length;
  const quoteFontSize = len > 280 ? 34 : len > 180 ? 40 : len > 100 ? 46 : 54;
  const quoteLineH = quoteFontSize * 1.55;

  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const quoteLines = wrapText(ctx, quoteText, contentW - 20);
  const quoteTotalH = quoteLines.length * quoteLineH;

  // Measure total block height:
  //   openMark(80) + gap(16) + quoteText + gap(48) + divider(1) + gap(36) + author(34) + gap(14) + title(24)
  const OPEN_MARK_H = 80;
  const GAP_MARK_QUOTE = 16;
  const GAP_QUOTE_DIV = 52;
  const DIV_H = 1;
  const GAP_DIV_AUTHOR = 40;
  const AUTHOR_FONT = 30;
  const GAP_AUTHOR_TITLE = 16;
  const TITLE_FONT = 22;

  const totalBlockH =
    OPEN_MARK_H + GAP_MARK_QUOTE +
    quoteTotalH +
    GAP_QUOTE_DIV + DIV_H + GAP_DIV_AUTHOR +
    AUTHOR_FONT + GAP_AUTHOR_TITLE + TITLE_FONT;

  // Center the block within the available zone
  const blockTop = HEADER_H + (availH - totalBlockH) / 2;

  // ── 7. Decorative opening quote mark ──────────────────────────────────────
  const markY = blockTop;
  ctx.save();
  ctx.font = `bold 110px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.shadowColor = 'transparent';
  ctx.fillText('"', centerX, markY + OPEN_MARK_H);
  ctx.restore();

  // ── 8. Quote text ─────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;
  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;

  const quoteStartY = markY + OPEN_MARK_H + GAP_MARK_QUOTE;
  quoteLines.forEach((line, i) => {
    ctx.fillText(line, centerX, quoteStartY + i * quoteLineH + quoteFontSize * 0.85);
  });
  const quoteEndY = quoteStartY + quoteTotalH;

  // ── 9. Thin divider line ───────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const divY = quoteEndY + GAP_QUOTE_DIV;
  const divW = 180;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - divW / 2, divY);
  ctx.lineTo(centerX + divW / 2, divY);
  ctx.stroke();

  // ── 10. Author name ────────────────────────────────────────────────────────
  const authorY = divY + GAP_DIV_AUTHOR + AUTHOR_FONT;
  ctx.font = `bold ${AUTHOR_FONT}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(bookAuthor.toUpperCase(), centerX, authorY);

  // ── 11. Book title / chapter ───────────────────────────────────────────────
  const titleY = authorY + GAP_AUTHOR_TITLE + TITLE_FONT;
  ctx.font = `italic ${TITLE_FONT}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.shadowBlur = 8;
  const titleText = chapterTitle ? `${bookTitle}: ${chapterTitle}` : bookTitle;
  // Wrap title if too long
  const titleLines = wrapText(ctx, titleText, contentW - 40);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, centerX, titleY + i * (TITLE_FONT * 1.5));
  });

  // ── 12. Footer area ────────────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Book cover (bottom-right)
  const COVER_W = 130;
  const COVER_H = 195;
  const COVER_X = SIZE - PAD - COVER_W;
  const COVER_Y = SIZE - 60 - COVER_H;

  if (coverImg) {
    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 8);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Clipped cover image
    ctx.save();
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 8);
    ctx.clip();
    ctx.drawImage(coverImg, COVER_X, COVER_Y, COVER_W, COVER_H);
    ctx.restore();

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    clipRoundedRect(ctx, COVER_X, COVER_Y, COVER_W, COVER_H, 8);
    ctx.stroke();
  }

  // Branding (bottom-left, vertically aligned with cover center)
  const brandAreaCenterY = COVER_Y + COVER_H / 2;

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `13px Georgia, serif`;
  const subLabel = 'AUDIOBOOKS & BOOKS';
  ctx.fillText(subLabel, PAD, brandAreaCenterY - 28);

  // "SCROLLREADER.COM" box
  const brand = 'SCROLLREADER.COM';
  ctx.font = `bold 24px Georgia, serif`;
  const brandMetrics = ctx.measureText(brand);
  const brandW = brandMetrics.width;
  const bpad = 20;
  const boxH = 48;
  const boxX = PAD;
  const boxY = brandAreaCenterY - 14;

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  clipRoundedRect(ctx, boxX, boxY, brandW + bpad * 2, boxH, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(brand, boxX + bpad, boxY + boxH - 13);

  return canvas.toDataURL('image/png', 1.0);
}
