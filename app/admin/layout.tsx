import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f', color: '#e8e8e8', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: '#161616',
        borderRight: '1px solid #2a2a2a', padding: '28px 0',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2a2a2a', marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>ScrollReader</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Admin CMS</div>
        </div>

        {[
          { href: '/admin', label: '📊 Dashboard' },
          { href: '/admin/audiobooks', label: '📚 Audiobooks' },
          { href: '/admin/audiobooks/new', label: '➕ New Audiobook' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            display: 'block', padding: '10px 20px',
            color: '#c8c8c8', textDecoration: 'none', fontSize: 14,
            borderRadius: 0, transition: 'background 0.15s',
          }}
          className="admin-nav-link"
          >
            {label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2a2a' }}>
          <Link href="/" style={{ color: '#666', fontSize: 13, textDecoration: 'none' }}>← View Site</Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        {children}
      </main>

      <style>{`
        .admin-nav-link:hover { background: #222 !important; color: #fff !important; }
        * { box-sizing: border-box; }
        input, textarea, select {
          background: #1e1e1e; border: 1px solid #333; color: #e8e8e8;
          padding: 8px 12px; border-radius: 6px; font-size: 14px; width: 100%;
          outline: none; transition: border-color 0.15s;
        }
        input:focus, textarea:focus, select:focus { border-color: #555; }
        label { font-size: 13px; color: #888; display: block; margin-bottom: 4px; }
        .form-group { margin-bottom: 18px; }
        .btn-primary {
          background: #3b82f6; color: #fff; border: none; padding: 10px 20px;
          border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .btn-primary:hover { background: #2563eb; }
        .btn-secondary {
          background: #252525; color: #c8c8c8; border: 1px solid #333; padding: 8px 16px;
          border-radius: 6px; font-size: 13px; cursor: pointer; text-decoration: none;
          display: inline-block;
        }
        .btn-secondary:hover { background: #2e2e2e; }
        .btn-danger {
          background: #ef4444; color: #fff; border: none; padding: 7px 14px;
          border-radius: 6px; font-size: 13px; cursor: pointer;
        }
        .btn-danger:hover { background: #dc2626; }
        .card {
          background: #161616; border: 1px solid #2a2a2a; border-radius: 10px; padding: 24px;
        }
        h1 { font-size: 22px; font-weight: 700; margin: 0 0 24px; color: #fff; }
        h2 { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #e0e0e0; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th { text-align: left; padding: 10px 12px; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 12px 12px; border-bottom: 1px solid #1e1e1e; vertical-align: middle; }
        tr:hover td { background: #1a1a1a; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #052e16; color: #4ade80; }
        .badge-gray  { background: #1c1c1c; color: #666; }
      `}</style>
    </div>
  );
}
