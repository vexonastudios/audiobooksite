'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, BookOpen, Clock, Bookmark } from 'lucide-react';

const tabs = [
  { href: '/',           label: 'Home',      icon: Home     },
  { href: '/search',     label: 'Search',    icon: Search   },
  { href: '/categories', label: 'Browse',    icon: BookOpen },
  { href: '/history',    label: 'History',   icon: Clock    },
  { href: '/bookmarks',  label: 'Saved',     icon: Bookmark },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar" style={{ display: 'none' }}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
              fontSize: '0.6875rem',
              fontWeight: active ? 600 : 400,
              padding: '6px 0',
              transition: 'color var(--transition-fast)',
            }}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
