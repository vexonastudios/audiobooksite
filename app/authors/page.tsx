import { getAllAuthors } from '@/lib/db/authors';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import type { Metadata } from 'next';
import AuthorsClient, { AuthorData } from './AuthorsClient';

export const metadata: Metadata = {
  title: 'Authors — Scroll Reader',
  description: 'Browse all Christian authors available as free audiobooks on Scroll Reader.',
};

export default async function AuthorsIndexPage() {
  const [authors, audiobooks] = await Promise.all([getAllAuthors(), getAllAudiobooks()]);

  // Compute stats per author
  const bookCount: Record<string, number> = {};
  const totalPlays: Record<string, number> = {};

  audiobooks.forEach((b) => {
    bookCount[b.authorName] = (bookCount[b.authorName] || 0) + 1;
    totalPlays[b.authorName] = (totalPlays[b.authorName] || 0) + (b.plays || 0);
  });

  // Only show authors who have books and assemble AuthorData records
  const withBooks: AuthorData[] = authors
    .filter((a) => bookCount[a.name] > 0)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      imageUrl: a.imageUrl,
      birthYear: a.birthYear,
      deathYear: a.deathYear,
      bookCount: bookCount[a.name],
      totalPlays: totalPlays[a.name] || 0,
    }));

  return <AuthorsClient authors={withBooks} />;
}
