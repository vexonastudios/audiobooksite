'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Search, List, Tag, Users, Network, ShoppingBasket, Book, Podcast,
  Heart, Download, History, Info, Bell, Mail, ChevronUp 
} from 'lucide-react';

const mainGroup = [
  { href: '/',               label: 'Home',                  icon: Home },
  { href: '/search',         label: 'Browse All Audiobooks', icon: Search },
  { href: '/categories',     label: 'Categories',            icon: List },
  { href: '/topics',         label: 'Topics',                icon: Tag },
  { href: '/authors',        label: 'Author or Subject',     icon: Users },
  { href: '/timeline',       label: 'Timeline',              icon: Network },
  { href: '/shop',           label: 'Shop',                  icon: ShoppingBasket },
  { href: '/printed-books',  label: 'Printed Books',         icon: Book },
  { href: '/podcasts',       label: 'Podcast Links',         icon: Podcast },
];

const youGroup = [
  { href: '/bookmarks',      label: 'Favorites',             icon: Heart },
  { href: '/downloads',      label: 'Downloads',             icon: Download },
  { href: '/history',        label: 'History',               icon: History },
];

const moreGroup = [
  { href: '/about',          label: 'About Us',              icon: Info },
  { href: '/announcements',  label: 'Get Monthly Updates',   icon: Bell },
  { href: '/contact',        label: 'Contact Us',            icon: Mail },
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
            gap: 16,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 2,
            background: active ? 'var(--color-surface-2)' : 'transparent',
            color: 'var(--color-text-primary)',
            fontWeight: active ? 600 : 400,
            fontSize: '1rem',
            transition: 'background var(--transition-fast)',
            textDecoration: 'none'
          }}
        >
          <Icon size={20} style={{ color: '#000', strokeWidth: 2.5 }} />
          {label}
          
          {/* Add a dummy toggle switch just for the Home row as seen in screenshot */}
          {label === 'Home' && (
            <div style={{ marginLeft: 'auto', width: 34, height: 20, background: '#000', borderRadius: 20, position: 'relative' }}>
              <div style={{ position: 'absolute', right: 2, top: 2, width: 16, height: 16, background: '#fff', borderRadius: '50%' }} />
            </div>
          )}
        </Link>
      );
    });
  }

  return (
    <aside className="sidebar" style={{ width: 280, borderRight: '1px solid #e5e5e5', background: '#fff', overflowY: 'auto' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <img src="/logo.png" alt="ScrollReader Logo" style={{ width: 'auto', height: 42, objectFit: 'contain' }} />
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {renderGroup(mainGroup)}

        <div style={{ height: 1, background: '#000', margin: '16px 0' }} />

        <div style={{ padding: '0 14px', marginBottom: 12, fontWeight: 700, fontSize: '1.2rem', color: '#000' }}>
          You
        </div>
        {renderGroup(youGroup)}

        <div style={{ height: 1, background: '#000', margin: '16px 0' }} />

        <div style={{ padding: '0 14px', marginBottom: 12, fontWeight: 700, fontSize: '1.2rem', color: '#000', display: 'flex', alignItems: 'center' }}>
          More <ChevronUp size={20} style={{ strokeWidth: 3, marginLeft: 4 }} />
        </div>
        {renderGroup(moreGroup)}
      </nav>

    </aside>
  );
}
