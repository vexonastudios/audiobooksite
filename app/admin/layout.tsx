import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, PlusCircle, FileText, User, ArrowLeftToLine, Mic, BarChart2, MessageSquare, Radio } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: '#F8F9FA', color: '#1A202C',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Sidebar */}
      <aside style={{
        width: 224, flexShrink: 0,
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        padding: '24px 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(46,106,167,0.06)',
      }}>
        {/* Brand */}
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #E2E8F0', marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#718096', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Scroll Reader</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#2e6aa7', letterSpacing: '-0.02em' }}>Admin CMS</div>
        </div>

        {[
          { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
          { href: '/admin/audiobooks', label: 'Audiobooks', icon: <BookOpen size={16} />, newHref: '/admin/audiobooks/new' },
          { href: '/admin/articles', label: 'Articles', icon: <FileText size={16} />, newHref: '/admin/articles/new' },
          { href: '/admin/authors', label: 'Authors', icon: <User size={16} />, newHref: '/admin/authors/new' },
          { href: '/admin/notifications', label: 'Announcements', icon: <Mic size={16} />, newHref: '/admin/notifications/new' },
          { href: '/admin/analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
          { href: '/admin/messages',  label: 'Messages',  icon: <MessageSquare size={16} /> },
          { href: '/admin/radio',     label: 'Scroll Radio', icon: <Radio size={16} />, newHref: '/admin/radio/new' },
        ].map(({ href, label, icon, newHref }) => (
          <div key={href} style={{ display: 'flex', alignItems: 'stretch', padding: '0 8px' }}>
            <Link href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', color: '#4A5568',
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              flex: 1, borderRadius: newHref ? '8px 0 0 8px' : '8px'
            }} className="admin-nav-link">
              <span style={{ color: '#2e6aa7', display: 'flex', alignItems: 'center' }}>{icon}</span>
              {label}
            </Link>
            {newHref && (
              <Link href={newHref} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', color: '#718096',
                textDecoration: 'none', borderRadius: '0 8px 8px 0'
              }} className="admin-nav-link" aria-label={`New ${label}`} title={`New ${label}`}>
                <PlusCircle size={16} />
              </Link>
            )}
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0' }}>
          <Link href="/" style={{ color: '#718096', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeftToLine size={14} /> View Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 36px' }}>
        {children}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .admin-nav-link:hover { background: #F0F4F8 !important; color: #2e6aa7 !important; }
        * { box-sizing: border-box; }

        input, textarea, select {
          background: #fff;
          border: 1px solid #E2E8F0;
          color: #1A202C;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 14px;
          width: 100%;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #2e6aa7;
          box-shadow: 0 0 0 3px rgba(46,106,167,0.12);
        }
        label {
          font-size: 12px;
          color: #718096;
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-group { margin-bottom: 18px; }

        .btn-primary {
          background: #2e6aa7;
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .btn-primary:hover { background: #23507e; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary {
          background: #fff;
          color: #4A5568;
          border: 1px solid #E2E8F0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-family: inherit;
          transition: border-color 0.15s, background 0.15s;
        }
        .btn-secondary:hover { background: #F8F9FA; border-color: #CBD5E0; }

        .btn-danger {
          background: #FEE2E2;
          color: #DC2626;
          border: none;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }
        .btn-danger:hover { background: #FECACA; }

        .card {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(46,106,167,0.06);
        }

        h1 { font-size: 22px; font-weight: 700; margin: 0 0 24px; color: #1A202C; }
        h2 { font-size: 14px; font-weight: 600; margin: 0 0 16px; color: #2e6aa7; text-transform: uppercase; letter-spacing: 0.06em; }

        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th {
          text-align: left; padding: 10px 14px;
          border-bottom: 2px solid #E2E8F0;
          color: #718096; font-size: 11px;
          text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;
          background: #F8F9FA;
        }
        td { padding: 12px 14px; border-bottom: 1px solid #F0F4F8; vertical-align: middle; color: #1A202C; }
        tr:hover td { background: #F8F9FA; }

        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .badge-green { background: #D1FAE5; color: #065F46; }
        .badge-gray  { background: #F3F4F6; color: #6B7280; }

        .section-divider {
          border: none;
          border-top: 1px solid #E2E8F0;
          margin: 28px 0 20px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #2e6aa7;
          margin: 0 0 16px;
        }
      `}</style>
    </div>
  );
}
