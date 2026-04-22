import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audiobook Categories',
  description: 'Browse free Christian audiobooks by category — Biographies, Devotional, Theology, Children, Missions, and more.',
  openGraph: {
    title: 'Audiobook Categories | Scroll Reader',
    description: 'Browse free Christian audiobooks by category.',
    url: 'https://scrollreader.com/categories',
  },
  alternates: { canonical: 'https://scrollreader.com/categories' },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
