import type { Metadata } from 'next';
import articlesJson from '@/public/data/articles.json';
import ArticleClient from './ArticleClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = (articlesJson as any[]).find((a: any) => a.slug === slug);

  if (!article) {
    return { title: 'Article Not Found' };
  }

  const plainExcerpt = (article.excerpt || article.description || '')
    .replace(/<[^>]*>/g, '')
    .slice(0, 160);
  const description = plainExcerpt || `Read "${article.title}" on ScrollReader.`;
  const url = `https://scrollreader.com/articles/${slug}`;
  const coverImage = article.coverImage || 'https://scrollreader.com/logo.png';

  return {
    title: `${article.title} — ${article.authorName}`,
    description,
    authors: [{ name: article.authorName }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: `${article.title} | ScrollReader`,
      description,
      url,
      siteName: 'ScrollReader',
      images: [{ url: coverImage, width: 800, height: 600, alt: article.title }],
      ...(article.pubDate ? { publishedTime: new Date(article.pubDate).toISOString() } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [coverImage],
      site: '@scroll_reader',
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = (articlesJson as any[]).find((a: any) => a.slug === slug);

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Article',
            headline: article.title,
            url: `https://scrollreader.com/articles/${slug}`,
            image: article.coverImage || undefined,
            datePublished: article.pubDate ? new Date(article.pubDate).toISOString() : undefined,
            author: { '@type': 'Person', name: article.authorName },
            publisher: {
              '@type': 'Organization',
              name: 'Scroll Reader',
              url: 'https://scrollreader.com',
              logo: { '@type': 'ImageObject', url: 'https://scrollreader.com/logo.png' },
            },
            description: (article.excerpt || article.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scrollreader.com' },
              { '@type': 'ListItem', position: 2, name: 'Articles', item: 'https://scrollreader.com/articles' },
              { '@type': 'ListItem', position: 3, name: article.title, item: `https://scrollreader.com/articles/${slug}` },
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
      <ArticleClient />
    </>
  );
}
