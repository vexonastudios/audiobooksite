import { getAllAudiobooksAdmin } from '@/lib/db/audiobooks';
import Link from 'next/link';

export default async function AdminDashboard() {
  let books: Awaited<ReturnType<typeof getAllAudiobooksAdmin>> = [];
  try { books = await getAllAudiobooksAdmin(); } catch {}

  const totalPlays = books.reduce((s, b) => s + (b.plays ?? 0), 0);
  const published  = books.filter(b => (b as { published?: boolean }).published !== false).length;

  const stats = [
    { label: 'Total Audiobooks', value: books.length, color: '#2e6aa7' },
    { label: 'Published',         value: published,    color: '#059669' },
    { label: 'Drafts',            value: books.length - published, color: '#D97706' },
    { label: 'Total Plays',       value: totalPlays.toLocaleString(), color: '#7C3AED' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <Link href="/admin/audiobooks/new" className="btn-primary">+ New Audiobook</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Recent Audiobooks</h2>
          <Link href="/admin/audiobooks" style={{ fontSize: 13, color: '#2e6aa7', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        {books.length === 0 ? (
          <p style={{ color: '#718096', fontSize: 14 }}>
            No audiobooks in the database yet.{' '}
            <a href="/admin/audiobooks/new" style={{ color: '#2e6aa7' }}>Add the first one</a>.
          </p>
        ) : (
          <table>
            <thead>
              <tr><th>Title</th><th>Author</th><th>Duration</th><th>Plays</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {books.slice(0, 10).map(b => (
                <tr key={b.id}>
                  <td style={{ maxWidth: 280, fontWeight: 500 }}>{b.title.length > 55 ? b.title.slice(0, 55) + '…' : b.title}</td>
                  <td style={{ color: '#4A5568' }}>{b.authorName}</td>
                  <td style={{ color: '#718096' }}>{b.totalDuration}</td>
                  <td style={{ color: '#718096' }}>{b.plays}</td>
                  <td>
                    <span className={`badge ${ (b as { published?: boolean }).published !== false ? 'badge-green' : 'badge-gray'}`}>
                      {(b as { published?: boolean }).published !== false ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/audiobooks/${b.id}/edit`} className="btn-secondary" style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
