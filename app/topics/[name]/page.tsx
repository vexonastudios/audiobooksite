import type { Metadata } from 'next';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import TopicClient from './TopicClient';

interface Props {
  params: Promise<{ name: string }>;
}

function slugToTitle(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params;
  const topicName = slugToTitle(name);
  
  // Get book count for this topic
  const allBooks = await getAllAudiobooks();
  const topicBooks = allBooks.filter(b =>
    b.topics.some(t => t.toLowerCase() === decodeURIComponent(name).toLowerCase() ||
      t.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') === name.toLowerCase())
  );
  const count = topicBooks.length;
  const topAuthors = [...new Set(topicBooks.map(b => b.authorName))].slice(0, 3).join(', ');

  const title = `Free Audiobooks on ${topicName} — Listen Online`;
  const description = `Listen to ${count} free audiobook${count !== 1 ? 's' : ''} about ${topicName}. Browse titles${topAuthors ? ` from authors like ${topAuthors}` : ''} on ScrollReader — the free Christian audiobook library.`;
  const url = `https://scrollreader.com/topics/${name}`;

  return {
    title,
    description,
    keywords: [topicName, `${topicName} audiobooks`, 'free christian audiobooks', 'listen online'],
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ScrollReader`,
      description,
      url,
      siteName: 'ScrollReader',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      site: '@scroll_reader',
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  };
}

export default async function TopicPage({ params }: Props) {
  const { name } = await params;
  const topicName = slugToTitle(name);
  const url = `https://scrollreader.com/topics/${name}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `Free Audiobooks on ${topicName}`,
        url,
        description: `Browse free Christian audiobooks about ${topicName}.`,
        isPartOf: { '@id': 'https://scrollreader.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scrollreader.com' },
          { '@type': 'ListItem', position: 2, name: 'Topics', item: 'https://scrollreader.com/topics' },
          { '@type': 'ListItem', position: 3, name: topicName, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TopicClient />
    </>
  );
}
