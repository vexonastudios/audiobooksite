import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';

/**
 * POST /api/admin/ai-seo
 * Body: { title: string, description: string, authorName: string }
 *
 * Uses Gemini to generate SEO-optimized content:
 *  - excerpt (2-3 sentence teaser)
 *  - metaDescription (under 160 chars, compelling)
 *  - focusKeyword (primary keyword phrase)
 *
 * Returns: { excerpt, metaDescription, focusKeyword }
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { title, description, authorName } = await req.json();
    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert SEO copywriter for a Christian audiobook website called "Scroll Reader". 
Given the following audiobook information, generate SEO-optimized content.

Title: ${title}
Author: ${authorName || 'Unknown'}
Description: ${description ? stripHtml(description).slice(0, 2000) : 'No description provided.'}

Generate the following in JSON format (and ONLY valid JSON, no markdown fences):
{
  "excerpt": "A compelling 2-3 sentence teaser/summary that entices listeners to start this audiobook. Write in an engaging, descriptive style. Keep under 300 characters.",
  "metaDescription": "A compelling meta description under 155 characters that includes the focus keyword naturally. Should entice clicks from search results.",
  "focusKeyword": "The primary SEO keyword phrase someone would search for to find this specific book (e.g., '[Book Title] audiobook' or '[Author Name] audiobook'). Do NOT use generic terms like 'christian audiobook'."
}

Important rules:
- The focus keyword MUST be specific to this exact book (use the Title or Author). Generic keywords are useless to us.
- The meta description must be under 155 characters and include the exact focus keyword phrase naturally.
- The excerpt should hook the reader and highlight what makes this audiobook unique.
- Do NOT include the title verbatim in the excerpt — paraphrase creatively.
- All content should be appropriate for a Christian audience.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse the JSON response (handle potential markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      excerpt: parsed.excerpt || '',
      metaDescription: parsed.metaDescription || '',
      focusKeyword: parsed.focusKeyword || '',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') return adminForbidden();
    console.error('ai-seo error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/** Strip HTML tags for cleaner AI input */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
