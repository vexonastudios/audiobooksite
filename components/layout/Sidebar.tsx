'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Headphones, Users, Tag, Bookmark, Clock, BookOpen, Quote, Hash, Bell, Trophy, BookMarked, ChevronUp, Heart, Mail, Settings2, Radio, DownloadCloud } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { useEffect, useState } from 'react';

const mainGroup = [
  { href: '/',            label: 'Home',       icon: Home       },
  { href: '/audiobooks',  label: 'Browse',     icon: Headphones },
  { href: '/authors',     label: 'Authors',    icon: Users      },
  { href: '/categories',  label: 'Categories', icon: Tag        },
  { href: '/topics',      label: 'Topics',     icon: Hash       },
  { href: '/printed-books',  label: 'Printed Books',  icon: BookMarked },
  { href: '/articles',       label: 'Articles',       icon: BookOpen   },
];

const youGroup = [
  { href: '/favorites',   label: 'Favorites',  icon: Heart         },
  { href: '/bookmarks',   label: 'Bookmarks',  icon: Bookmark      },
  { href: '/quotes',      label: 'Quotes',     icon: Quote         },
  { href: '/history',     label: 'History',    icon: Clock         },
  { href: '/downloads',   label: 'Downloads',  icon: DownloadCloud },
  { href: '/stats',       label: 'My Stats',   icon: Trophy        },
  { href: '/settings',    label: 'Settings',   icon: Settings2     },
];

const moreGroup = [
  { href: '/connect',        label: 'Connect',         icon: Radio  },
  { href: '/announcements',  label: 'Announcements',  icon: Bell   },
  { href: '/contact',        label: 'Contact Us',      icon: Mail   },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const [isOnline, setIsOnline] = useState(true);

  // Track online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close sidebar whenever route changes (mobile navigation)
  useEffect(() => {
    closeSidebar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function renderGroup(items: { href: string; label: string; icon: any }[]) {
    return items.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || (href !== '/' && pathname.startsWith(href));
      return (
        <Link
          key={label + href}
          href={href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 2,
            background: active ? 'var(--color-surface-2)' : 'transparent',
            color: active ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            fontWeight: active ? 600 : 400,
            fontSize: '0.9375rem',
            transition: 'all var(--transition-fast)',
            textDecoration: 'none'
          }}
        >
          <Icon size={18} />
          {label}
        </Link>
      );
    });
  }

  return (
    <>
      {/* Dark overlay — sits behind sidebar, closes it when tapped (mobile only) */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          aria-hidden="true"
          className="sidebar-overlay"
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/scroll-reader-logo-new2.png" className="brand-logo" alt="Scroll Reader Logo" style={{ width: 'auto', height: 36, objectFit: 'contain' }} />
            </div>
            <div className="mobile-only" style={{ alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="Scroll Reader Logo" style={{ width: 'auto', height: 36, objectFit: 'contain' }} />
              <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                Scroll Reader
              </span>
            </div>
          </Link>
          <div className="desktop-only">
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
              Free Christian Audiobooks
            </p>
          </div>
          <div className="mobile-only">
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, marginLeft: 46 }}>
              Free Christian Audiobooks
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          {!isOnline && (
            <div style={{ padding: '8px 12px', marginBottom: 12, background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-error)' }}>You are offline</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>Only saved downloads are available.</div>
            </div>
          )}

          {isOnline && renderGroup(mainGroup)}

          {isOnline && <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 8px' }} />}

          <div style={{ padding: '0 12px', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
            You
          </div>
          {renderGroup(isOnline ? youGroup : youGroup.filter(g => g.href === '/downloads' || g.href === '/settings'))}

          {isOnline && (
            <>
              <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 8px' }} />
              <div style={{ padding: '0 12px', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' }}>
                More <ChevronUp size={16} style={{ strokeWidth: 2.5, marginLeft: 4 }} />
              </div>
              {renderGroup(moreGroup)}
            </>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          © {new Date().getFullYear()} Scroll Reader
        </div>
      </aside>
    </>
  );
}
