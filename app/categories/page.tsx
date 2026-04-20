'use client';

import Link from 'next/link';
import { useLibraryStore, slugify } from '@/lib/store/libraryStore';

import {
  BookUser, Baby, Heart, Landmark, Handshake, 
  Sun, Megaphone, Plane, Compass, Mic, 
  Shield, HeartCrack, Zap, Library, LayoutGrid
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.FC<any>> = {
  'Biographies': BookUser,
  'Children and Youth': Baby,
  'Christian Living': Heart,
  'Church History': Landmark,
  'Counseling': Handshake,
  'Devotionals': Sun,
  'Evangelism': Megaphone,
  'Missionary Biographies': Plane,
  'Missions': Compass,
  'Sermons': Mic,
  'Spiritual Warfare': Shield,
  'Suffering': HeartCrack,
  'Teens and Young Adults': Zap,
  'Theological Studies': Library,
  'Uncategorized': LayoutGrid,
};

export default function CategoriesIndex() {
  const categories = useLibraryStore((s) => s.getAllCategories());
  
  if (!useLibraryStore((s) => s.isLoaded)) {
    return <div className="page"><div className="skeleton" style={{ height: 400 }} /></div>;
  }

  return (
    <div className="page pb-24">
      <h1 style={{ marginBottom: 32 }}>Categories</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {categories.map((cat) => {
          const books = useLibraryStore.getState().getByCategory(cat);
          const Icon = CATEGORY_ICONS[cat] || LayoutGrid;

          return (
            <Link 
              key={cat} 
              href={`/categories/${slugify(cat)}`} 
              className="card" 
              style={{ 
                padding: '24px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16,
                transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)' 
              }} 
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }} 
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
               <div style={{
                 width: 44, height: 44, borderRadius: '50%',
                 background: 'rgba(46,106,167,0.08)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: 'var(--color-brand)', flexShrink: 0,
               }}>
                 <Icon size={20} strokeWidth={2.5} />
               </div>
               
               <div style={{ flex: 1, minWidth: 0 }}>
                 <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>
                   {cat}
                 </div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                   {books.length} Books
                 </div>
               </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
