import { getAllAudiobooksAdmin } from '@/lib/db/audiobooks';

export default async function AdminDashboard() {
  let books: Awaited<ReturnType<typeof getAllAudiobooksAdmin>> = [];
  try {
    books = await getAllAudiobooksAdmin();
  } catch {
    // DB not yet seeded — show empty state
  }

  const totalPlays = books.reduce((s, b) => s + (b.plays ?? 0), 0);
  const published = books.filter(b => (b as { published?: boolean }).published !== false).length;

  const stats = [
    { label: 'Total Audiobooks', value: books.length },
    { label: 'Published', value: published },
    { label: 'Drafts', value: books.length - published },
    { label: 'Total Plays', value: totalPlays.toLocaleString() },
  ];

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="card">
        <h2>Recent Audiobooks</h2>
        {books.length === 0 ? (
          <p style={{ color: '#666', fontSize: 14 }}>
            No audiobooks in the database yet.{' '}
            <a href="/admin/audiobooks/new" style={{ color: '#3b82f6' }}>Add the first one</a> or{' '}
            run the migration script.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Duration</th>
                <th>Plays</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {books.slice(0, 10).map(b => (
                <tr key={b.id}>
                  <td style={{ color: '#e8e8e8', maxWidth: 280 }}>{b.title}</td>
                  <td style={{ color: '#aaa' }}>{b.authorName}</td>
                  <td style={{ color: '#aaa' }}>{b.totalDuration}</td>
                  <td style={{ color: '#aaa' }}>{b.plays}</td>
                  <td>
                    <span className={`badge ${ (b as { published?: boolean }).published !== false ? 'badge-green' : 'badge-gray'}`}>
                      {(b as { published?: boolean }).published !== false ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <a href={`/admin/audiobooks/${b.id}/edit`} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                      Edit
                    </a>
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
