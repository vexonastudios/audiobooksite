'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Headphones, Users, Tag, Bookmark, Clock, BookOpen, Quote, Hash, Bell, Trophy, BookMarked, ChevronUp } from 'lucide-react';

const mainGroup = [
  { href: '/',            label: 'Home',       icon: Home       },
  { href: '/categories',  label: 'Browse',     icon: Headphones },
  { href: '/authors',     label: 'Authors',    icon: Users      },
  { href: '/categories',  label: 'Categories', icon: Tag        },
  { href: '/topics',      label: 'Topics',     icon: Hash       },
  { href: '/printed-books',  label: 'Printed Books',  icon: BookMarked },
  { href: '/articles',       label: 'Articles',       icon: BookOpen   },
];

const youGroup = [
  { href: '/bookmarks',   label: 'Bookmarks',  icon: Bookmark   },
  { href: '/quotes',      label: 'Quotes',     icon: Quote      },
  { href: '/history',     label: 'History',    icon: Clock      },
  { href: '/stats',       label: 'My Stats',   icon: Trophy     },
];

const moreGroup = [
  { href: '/announcements',  label: 'Announcements',  icon: Bell   },
];

export function Sidebar() {
  const pathname = usePathname();

  function renderGroup(items: any[]) {
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
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="ScrollReader Logo" style={{ width: 'auto', height: 36, objectFit: 'contain' }} />
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
            ScrollReader
          </span>
        </Link>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, marginLeft: 46 }}>
          Free Christian Audiobooks
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 12px' }}>
        {renderGroup(mainGroup)}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 8px' }} />

        <div style={{ padding: '0 12px', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
          You
        </div>
        {renderGroup(youGroup)}

        <div style={{ height: 1, background: 'var(--color-border)', margin: '16px 8px' }} />

        <div style={{ padding: '0 12px', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center' }}>
          More <ChevronUp size={16} style={{ strokeWidth: 2.5, marginLeft: 4 }} />
        </div>
        {renderGroup(moreGroup)}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        © {new Date().getFullYear()} ScrollReader
      </div>
    </aside>
  );
}
