/**
 * generateQuoteImage.ts
 * Renders a quote image directly onto an HTML5 Canvas and returns a PNG data URL.
 * This is far more reliable than html-to-image because the browser is fully in control
 * of the canvas paint cycle — no off-screen DOM tricks required.
 */

interface QuoteImageOptions {
  quoteText: string;
  bookAuthor: string;
  bookTitle: string;
  chapterTitle?: string;
  bookCoverUrl: string; // original URL; we'll fetch via our proxy
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

function drawRoundedRect(
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

  // --- 1. Load cover via our Next.js proxy (avoids CORS taint) ---
  const proxyUrl = bookCoverUrl
    ? `/api/image-proxy?url=${encodeURIComponent(bookCoverUrl)}`
    : null;

  let coverImg: HTMLImageElement | null = null;
  if (proxyUrl) {
    try {
      coverImg = await loadImage(proxyUrl);
    } catch {
      coverImg = null;
    }
  }

  // --- 2. Dark base background ---
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // --- 3. Blurred cover background ---
  if (coverImg) {
    ctx.save();
    ctx.filter = 'blur(40px) brightness(0.22)';
    // Over-draw to avoid blur edge artifact
    const overflow = 120;
    const scale = Math.max(
      (SIZE + overflow * 2) / coverImg.width,
      (SIZE + overflow * 2) / coverImg.height
    );
    const bw = coverImg.width * scale;
    const bh = coverImg.height * scale;
    ctx.drawImage(coverImg, (SIZE - bw) / 2, (SIZE - bh) / 2, bw, bh);
    ctx.restore();
  }

  // --- 4. Gradient overlay ---
  const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
  grad.addColorStop(0, 'rgba(0,0,0,0.05)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // --- 5. Quote text ---
  const PAD = 130;
  const contentW = SIZE - PAD * 2;
  const centerX = SIZE / 2;

  const quoteFontSize = quoteText.length > 200 ? 40 : quoteText.length > 120 ? 46 : 52;
  const quoteLineH = quoteFontSize * 1.45;
  ctx.font = `${quoteFontSize}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const quoteLines = wrapText(ctx, quoteText, contentW);
  const quoteTotalH = quoteLines.length * quoteLineH;

  // Center block — quote + author + title
  const authorFontSize = 28;
  const titleFontSize = 22;
  const gap1 = 52; // gap between quote and author
  const gap2 = 18; // gap between author and title
  const blockH = quoteTotalH + gap1 + authorFontSize + gap2 + titleFontSize;
  let blockTop = (SIZE - blockH) / 2;

  // Quote
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 3;

  quoteLines.forEach((line, i) => {
    ctx.fillText(line, centerX, blockTop + i * quoteLineH + quoteFontSize);
  });
  const quoteBottom = blockTop + quoteTotalH;

  // Author
  ctx.font = `bold ${authorFontSize}px Georgia, serif`;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  const authorY = quoteBottom + gap1;
  ctx.fillText(bookAuthor.toUpperCase(), centerX, authorY);

  // Book title / chapter
  ctx.font = `italic ${titleFontSize}px Georgia, serif`;
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;
  ctx.globalAlpha = 0.88;
  const titleText = chapterTitle ? `${bookTitle}: ${chapterTitle}` : bookTitle;
  const titleY = authorY + gap2 + titleFontSize;
  ctx.fillText(titleText, centerX, titleY);
  ctx.globalAlpha = 1;

  // --- 6. Branding (bottom-left) ---
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = `14px Georgia, serif`;
  ctx.fillText('AUDIOBOOKS & BOOKS', PAD, SIZE - 110);

  const brand = 'SCROLLREADER.COM';
  ctx.font = `bold 22px Georgia, serif`;
  const brandW = ctx.measureText(brand).width;
  const bx = PAD;
  const by = SIZE - 96;
  const bh2 = 44;
  const bpad = 18;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, bx, by, brandW + bpad * 2, bh2, 6);
  ctx.stroke();
  ctx.fillStyle = 'white';
  ctx.fillText(brand, bx + bpad, by + bh2 - 12);

  // --- 7. Book cover thumbnail (bottom-right) ---
  if (coverImg) {
    const cw = 120;
    const ch = 178;
    const cx2 = SIZE - PAD - cw;
    const cy2 = SIZE - 60 - ch;

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    drawRoundedRect(ctx, cx2, cy2, cw, ch, 6);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Clip + draw
    ctx.save();
    drawRoundedRect(ctx, cx2, cy2, cw, ch, 6);
    ctx.clip();
    ctx.drawImage(coverImg, cx2, cy2, cw, ch);
    ctx.restore();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, cx2, cy2, cw, ch, 6);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png', 1.0);
}
