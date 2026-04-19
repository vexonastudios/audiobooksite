import { getAllAuthors } from '@/lib/db/authors';
import { getAllAudiobooks } from '@/lib/db/audiobooks';
import Link from 'next/link';
import { User, Plus, Edit2, Trash2, BookOpen } from 'lucide-react';

export default async function AdminAuthorsPage() {
  const [authors, audiobooks] = await Promise.all([getAllAuthors(), getAllAudiobooks()]);

  // Count books per author name
  const bookCount: Record<string, number> = {};
  audiobooks.forEach((b) => {
    bookCount[b.authorName] = (bookCount[b.authorName] || 0) + 1;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Authors</h1>
          <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 14 }}>{authors.length} authors in the database</p>
        </div>
        <Link href="/admin/authors/new" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> New Author
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Photo</th>
              <th>Name</th>
              <th>Lifespan</th>
              <th>Slug</th>
              <th style={{ width: 80 }}>Books</th>
              <th style={{ width: 80 }}>Bio</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.map((author) => (
              <tr key={author.id}>
                <td style={{ textAlign: 'center' }}>
                  {author.imageUrl ? (
                    <img src={author.imageUrl} alt={author.name}
                      style={{ width: 40, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #E2E8F0' }} />
                  ) : (
                    <div style={{ width: 40, height: 48, background: '#EFF6FF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      <User size={18} color="#93C5FD" />
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{author.name}</div>
                  <a href={`/author/${author.slug}`} target="_blank"
                    style={{ fontSize: 11, color: '#2563EB', textDecoration: 'none' }}>
                    /author/{author.slug}/ ↗
                  </a>
                </td>
                <td style={{ fontSize: 13, color: '#718096' }}>
                  {author.birthYear && author.deathYear
                    ? `${author.birthYear} – ${author.deathYear}`
                    : author.birthYear
                    ? `b. ${author.birthYear}`
                    : <span style={{ color: '#CBD5E0' }}>—</span>
                  }
                </td>
                <td style={{ fontSize: 12, color: '#718096', fontFamily: 'monospace' }}>{author.slug}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: bookCount[author.name] ? '#1D4ED8' : '#CBD5E0' }}>
                    <BookOpen size={12} />{bookCount[author.name] || 0}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {author.description ? (
                    <span style={{ fontSize: 11, background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 4 }}>Yes</span>
                  ) : (
                    <span style={{ fontSize: 11, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 4 }}>No</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <Link href={`/admin/authors/${author.id}/edit`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '5px 10px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', textDecoration: 'none' }}>
                      <Edit2 size={12} /> Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
