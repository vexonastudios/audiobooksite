import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAudiobookBySlug } from '@/lib/db/audiobooks';
import AudiobookClient from './AudiobookClient';


interface Props {
  params: Promise<{ slug: string }>;
}

// ── Server-side metadata for SEO ───────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let book = null;
  try { book = await getAudiobookBySlug(slug); } catch {}

  if (!book) {
    return { title: 'Audiobook Not Found' };
  }

  const description =
    (book.excerpt || book.description || '').replace(/<[^>]*>/g, '').slice(0, 160) ||
    `Listen to "${book.title}" by ${book.authorName} — a free Christian audiobook on ScrollReader.`;

  const url = `https://scrollreader.com/audiobook/${book.slug}`;
  const coverImage = book.coverImage || book.thumbnailUrl || 'https://scrollreader.com/placeholder.png';

  return {
    title: `${book.title} by ${book.authorName} — Free Audiobook`,
    description,
    authors: [{ name: book.authorName }],
    keywords: [...book.categories, ...book.topics, 'christian audiobook', 'free audiobook', book.authorName],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'book',
      title: `${book.title} by ${book.authorName} — Free Audiobook | ScrollReader`,
      description,
      url,
      siteName: 'ScrollReader',
      images: [
        {
          url: coverImage,
          width: 512,
          height: 768,
          alt: book.title,
        },
      ],
      audio: book.mp3Url
        ? [
            {
              url: book.mp3Url,
              type: 'audio/mpeg',
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} by ${book.authorName}`,
      description,
      images: [coverImage],
      site: '@scroll_reader',
      creator: '@scroll_reader',
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

// ── Helper: convert "HH:MM:SS" duration to ISO 8601 ────────────────────────────
function durationToISO(totalDuration: string): string {
  if (!totalDuration) return 'PT0S';
  const parts = totalDuration.split(':').map(Number);
  if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  if (parts.length === 2) return `PT${parts[0]}M${parts[1]}S`;
  return 'PT0S';
}

// ── Server Component: renders JSON-LD + mounts client UI ───────────────────────
export default async function AudiobookPage({ params }: Props) {
  const { slug } = await params;
  let book = null;
  try { book = await getAudiobookBySlug(slug); } catch {}

  // JSON-LD structured data (only when book exists)
  const jsonLd = book
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Audiobook',
            url: `https://scrollreader.com/audiobook/${book.slug}`,
            name: book.title,
            author: {
              '@type': 'Person',
              name: book.authorName,
            },
            readBy: {
              '@type': 'Organization',
              name: 'Scroll Reader',
            },
            bookFormat: 'https://schema.org/AudiobookFormat',
            publisher: {
              '@type': 'Organization',
              name: 'Scroll Reader',
              url: 'https://scrollreader.com',
              logo: {
                '@type': 'ImageObject',
                url: 'https://scrollreader.com/logo.png',
              },
            },
            image: book.coverImage || book.thumbnailUrl,
            description: (book.excerpt || book.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
            genre: book.categories[0] || 'Christian Literature',
            datePublished: book.pubDate ? book.pubDate.split('T')[0] : undefined,
            inLanguage: 'en-US',
            duration: durationToISO(book.totalDuration),
            offers: {
              '@type': 'Offer',
              price: '0.00',
              priceCurrency: 'USD',
              priceValidUntil: '2028-01-01',
              itemCondition: 'https://schema.org/NewCondition',
              availability: 'https://schema.org/InStock',
              url: `https://scrollreader.com/audiobook/${book.slug}`,
              seller: {
                '@type': 'Organization',
                name: 'Scroll Reader',
              },
            },
            potentialAction: {
              '@type': 'ListenAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `https://scrollreader.com/audiobook/${book.slug}`,
              },
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://scrollreader.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Audiobooks',
                item: 'https://scrollreader.com/audiobooks',
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: book.title,
                item: `https://scrollreader.com/audiobook/${book.slug}`,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense>
        <AudiobookClient />
      </Suspense>
    </>
  );
}
