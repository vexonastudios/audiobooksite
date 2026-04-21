import type { Metadata } from 'next';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import CategoryClient from './CategoryClient';

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
  const categoryName = slugToTitle(name);

  const allBooks = await getAllAudiobooks();
  const catBooks = allBooks.filter(b =>
    b.categories.some(c =>
      c.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '') === name.toLowerCase() ||
      c.toLowerCase() === decodeURIComponent(name).toLowerCase()
    )
  );
  const count = catBooks.length;
  const topAuthors = [...new Set(catBooks.map(b => b.authorName))].slice(0, 3).join(', ');

  const title = `${categoryName} Audiobooks — Free Christian Listening`;
  const description = `Explore ${count} free ${categoryName.toLowerCase()} audiobook${count !== 1 ? 's' : ''}${topAuthors ? ` from authors like ${topAuthors}` : ''}. Listen online at ScrollReader — the free Christian audiobook library.`;
  const url = `https://scrollreader.com/categories/${name}`;

  return {
    title,
    description,
    keywords: [categoryName, `${categoryName} audiobooks`, 'free christian audiobooks', 'christian literature'],
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

export default async function CategoryPage({ params }: Props) {
  const { name } = await params;
  const categoryName = slugToTitle(name);
  const url = `https://scrollreader.com/categories/${name}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${categoryName} Audiobooks`,
        url,
        description: `Free ${categoryName.toLowerCase()} audiobooks from classic Christian authors.`,
        isPartOf: { '@id': 'https://scrollreader.com/#website' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scrollreader.com' },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://scrollreader.com/categories' },
          { '@type': 'ListItem', position: 3, name: categoryName, item: url },
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
      <CategoryClient />
    </>
  );
}
