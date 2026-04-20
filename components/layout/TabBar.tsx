'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Heart, Quote, BookmarkPlus, Clock, User } from 'lucide-react';
import { useUserStore } from '@/lib/store/userStore';
import { useEffect, useState } from 'react';

const allTabs: Record<string, { href: string; label: string; icon: React.ElementType }> = {
  home: { href: '/', label: 'Home', icon: Home },
  browse: { href: '/audiobooks', label: 'Browse', icon: BookOpen },
  favorites: { href: '/favorites', label: 'Favorites', icon: Heart },
  bookmarks: { href: '/bookmarks', label: 'Bookmarks', icon: BookmarkPlus },
  quotes: { href: '/quotes', label: 'Quotes', icon: Quote },
  history: { href: '/history', label: 'History', icon: Clock },
  status: { href: '/status', label: 'My Status', icon: User },
};

const DEFAULT_TABS = ['home', 'browse', 'favorites', 'quotes'];

export function TabBar() {
  const pathname = usePathname();
  const mobileNavActions = useUserStore((s) => s.mobileNavActions);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use default tabs during SSR to prevent hydration mismatch
  const tabsToRender = mounted && mobileNavActions?.length > 0 ? mobileNavActions : DEFAULT_TABS;

  return (
    <nav className="tab-bar">
      {tabsToRender.map((key) => {
        const tab = allTabs[key];
        if (!tab) return null;
        
        const { href, label, icon: Icon } = tab;
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        
        return (
          <Link
            key={key}
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
