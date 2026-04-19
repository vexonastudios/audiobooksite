import { getAuthorById } from '@/lib/db/authors';
import { AuthorForm } from '../../AuthorForm';
import { notFound } from 'next/navigation';

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await getAuthorById(id);
  if (!author) notFound();

  const formData = {
    id: author.id,
    name: author.name,
    slug: author.slug,
    birthYear: author.birthYear ? String(author.birthYear) : '',
    deathYear: author.deathYear ? String(author.deathYear) : '',
    description: author.description ?? '',
    imageUrl: author.imageUrl ?? '',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Edit: {author.name}</h1>
        <a href={`/author/${author.slug}`} target="_blank" className="btn-secondary">
          View on Site ↗
        </a>
      </div>
      <div className="card">
        <AuthorForm mode="edit" initialData={formData} />
      </div>
    </div>
  );
}
