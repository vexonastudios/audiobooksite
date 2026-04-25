import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import sharp from 'sharp';

export const runtime = 'nodejs';

/**
 * POST /api/admin/generate-colors
 * Body: { imageUrl: string }
 *
 * Downloads the cover image, extracts dominant colors using sharp,
 * and returns a CSS gradient string.
 *
 * Returns: { generatedColors: "linear-gradient(…)" }
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Resize to tiny image for fast color extraction
    const { data, info } = await sharp(buffer)
      .resize(8, 8, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Extract all pixel colors
    const colors: [number, number, number][] = [];
    for (let i = 0; i < data.length; i += info.channels) {
      colors.push([data[i], data[i + 1], data[i + 2]]);
    }

    // Simple k-means-ish: pick 3 distinct colors by clustering
    const dominant = extractDominantColors(colors, 3);

    // Sort by luminance (darkest first for a nice gradient)
    dominant.sort((a, b) => luminance(a) - luminance(b));

    // Build CSS gradient
    const hexColors = dominant.map(c => rgbToHex(c[0], c[1], c[2]));
    const gradient = `linear-gradient(to bottom, ${hexColors[0]}, ${hexColors[1]}, ${hexColors[2]})`;

    return NextResponse.json({ generatedColors: gradient });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('generate-colors error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function luminance(c: [number, number, number]): number {
  return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function extractDominantColors(pixels: [number, number, number][], count: number): [number, number, number][] {
  if (pixels.length <= count) return pixels;

  // Pick initial centroids spread across the pixel array
  const centroids: [number, number, number][] = [];
  const step = Math.floor(pixels.length / count);
  for (let i = 0; i < count; i++) {
    centroids.push([...pixels[i * step]]);
  }

  // Run a few iterations of k-means
  for (let iter = 0; iter < 10; iter++) {
    const clusters: [number, number, number][][] = Array.from({ length: count }, () => []);

    for (const px of pixels) {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < count; c++) {
        const d = colorDistance(px, centroids[c]);
        if (d < minDist) { minDist = d; closest = c; }
      }
      clusters[closest].push(px);
    }

    for (let c = 0; c < count; c++) {
      if (clusters[c].length === 0) continue;
      const avg: [number, number, number] = [0, 0, 0];
      for (const px of clusters[c]) {
        avg[0] += px[0]; avg[1] += px[1]; avg[2] += px[2];
      }
      centroids[c] = [
        Math.round(avg[0] / clusters[c].length),
        Math.round(avg[1] / clusters[c].length),
        Math.round(avg[2] / clusters[c].length),
      ];
    }
  }

  // Ensure we have enough distinct colors
  const result = [centroids[0]];
  for (let i = 1; i < centroids.length; i++) {
    if (result.every(r => colorDistance(r, centroids[i]) > 20)) {
      result.push(centroids[i]);
    }
  }

  // If we don't have enough distinct colors, darken/lighten existing ones
  while (result.length < count) {
    const base = result[result.length - 1];
    result.push([
      Math.min(255, base[0] + 40),
      Math.min(255, base[1] + 40),
      Math.min(255, base[2] + 40),
    ]);
  }

  return result.slice(0, count);
}
