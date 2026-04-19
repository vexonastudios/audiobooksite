import { getAudiobookById } from '@/lib/db/audiobooks';
import { AudiobookForm } from '../../AudiobookForm';
import { notFound } from 'next/navigation';

export default async function EditAudiobook({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getAudiobookById(id);
  if (!book) notFound();

  // Map DB types to form-friendly types
  const formData = {
    id: book.id,
    title: book.title,
    slug: book.slug,
    authorName: book.authorName,
    originalYear: book.originalYear ?? '',
    pubDate: typeof book.pubDate === 'string' ? book.pubDate : '',
    published: (book as { published?: boolean }).published !== false,
    excerpt: book.excerpt ?? '',
    description: book.description ?? '',
    coverImage: book.coverImage ?? '',
    thumbnailUrl: book.thumbnailUrl ?? '',
    mp3Url: book.mp3Url ?? '',
    mp3UrlLow: (book as { mp3UrlLow?: string }).mp3UrlLow ?? '',
    totalDuration: book.totalDuration ?? '',
    lengthStr: book.length ?? '',
    durationSecs: 0,
    youtubeLink: book.youtubeLink ?? '',
    spotifyLink: book.spotifyLink ?? '',
    buyLink: book.buyLink ?? '',
    categories: book.categories ?? [],
    topics: book.topics ?? [],
    generatedColors: book.generatedColors ?? '',
    plays: book.plays ?? 0,
    chapters: book.chapters ?? [],
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Edit: {book.title}</h1>
        <a href={`/audiobook/${book.slug}`} target="_blank" className="btn-secondary">View on Site ↗</a>
      </div>
      <div className="card">
        <AudiobookForm mode="edit" initialData={formData} />
      </div>
    </div>
  );
}
