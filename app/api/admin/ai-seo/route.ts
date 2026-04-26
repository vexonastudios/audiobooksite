import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, adminForbidden } from '@/lib/admin-auth';

export const runtime = 'nodejs';

/**
 * POST /api/admin/ai-seo
 * Body: { title: string, description: string, authorName: string }
 *
 * Uses Gemini 1.5 Flash via direct REST (v1) to generate SEO-optimized content.
 * We bypass the @google/generative-ai SDK because it targets v1beta where the model
 * is not always available.
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

    const prompt = `You are an expert SEO copywriter for a Christian audiobook website called "Scroll Reader". 
Given the following audiobook information, generate SEO-optimized content.

Title: ${title}
Author: ${authorName || 'Unknown'}
Description: ${description ? stripHtml(description).slice(0, 2000) : 'No description provided.'}

Generate the following in JSON format (and ONLY valid JSON, no markdown fences):
{
  "excerpt": "A compelling 2-3 sentence teaser/summary that entices listeners to start this audiobook. Write in an engaging, descriptive style. Keep under 300 characters.",
  "metaDescription": "A compelling meta description under 155 characters that includes the focus keyword naturally. Should entice clicks from search results.",
  "focusKeyword": "A 2-4 word primary SEO keyword phrase that someone would search for to find this audiobook (e.g. 'free christian audiobook', 'puritan devotional audiobook', etc.)"
}

Important rules:
- The excerpt should hook the reader and highlight what makes this audiobook unique
- The meta description must be under 155 characters and include the focus keyword
- The focus keyword should be realistic search terms people actually use
- All content should be appropriate for a Christian audience
- Do NOT include the title verbatim in the excerpt — paraphrase creatively`;

    // Call the Gemini REST API directly on v1 (not v1beta) to avoid model availability issues
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(errText);
    }

    const geminiData = await geminiRes.json();
    const text: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

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
