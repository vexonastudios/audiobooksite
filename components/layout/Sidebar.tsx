'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Headphones, Users, Tag, Bookmark, Clock, BookOpen, Quote, Hash, Bell } from 'lucide-react';

const navItems = [
  { href: '/',            label: 'Home',       icon: Home       },
  { href: '/categories',  label: 'Browse',     icon: Headphones },
  { href: '/authors',     label: 'Authors',    icon: Users      },
  { href: '/categories',  label: 'Categories', icon: Tag        },
  { href: '/topics',      label: 'Topics',     icon: Hash       },
  { href: '/bookmarks',   label: 'Bookmarks',  icon: Bookmark   },
  { href: '/quotes',      label: 'Quotes',     icon: Quote      },
  { href: '/history',     label: 'History',    icon: Clock      },
  { href: '/articles',       label: 'Articles',       icon: BookOpen   },
  { href: '/announcements',  label: 'Announcements',  icon: Bell       },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--color-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.1rem',
            flexShrink: 0,
          }}>S</div>
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
        {navItems.map(({ href, label, icon: Icon }) => {
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
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        © 2024 ScrollReader
      </div>
    </aside>
  );
}
