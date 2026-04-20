'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Clock, Quote } from 'lucide-react';

const tabs = [
  { href: '/',           label: 'Home',    icon: Home     },
  { href: '/categories', label: 'Browse',  icon: BookOpen },
  { href: '/history',    label: 'History', icon: Clock    },
  { href: '/quotes',     label: 'Quotes',  icon: Quote    },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar">
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
              gap: 4,
              color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
              fontSize: '0.6875rem',
              fontWeight: active ? 600 : 400,
              padding: '8px 0',
              transition: 'color var(--transition-fast)',
              textDecoration: 'none',
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
