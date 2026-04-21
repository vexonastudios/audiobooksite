import { MetadataRoute } from 'next';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import { getAllAuthors } from '@/lib/db/authors';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://scrollreader.com';

  // Fetch all data
  const [audiobooks, authors] = await Promise.all([
    getAllAudiobooks(),
    getAllAuthors(),
  ]);

  // Gather unique categories and topics
  const categorySet = new Set<string>();
  const topicSet = new Set<string>();
  audiobooks.forEach((b) => {
    b.categories.forEach((c) => categorySet.add(c));
    b.topics.forEach((t) => topicSet.add(t));
  });

  function slugify(text: string): string {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/audiobooks`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/authors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/topics`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/printed-books`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/articles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  // Audiobook pages
  const audiobookPages: MetadataRoute.Sitemap = audiobooks.map((book) => ({
    url: `${BASE}/audiobook/${book.slug}`,
    lastModified: book.pubDate ? new Date(book.pubDate) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Author pages
  const authorPages: MetadataRoute.Sitemap = authors.map((author) => ({
    url: `${BASE}/author/${author.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = Array.from(categorySet).map((cat) => ({
    url: `${BASE}/categories/${slugify(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // Topic pages
  const topicPages: MetadataRoute.Sitemap = Array.from(topicSet).map((topic) => ({
    url: `${BASE}/topics/${slugify(topic)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...audiobookPages,
    ...authorPages,
    ...categoryPages,
    ...topicPages,
  ];
}
