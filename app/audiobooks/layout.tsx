import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Free Christian Audiobooks',
  description: 'Explore our full library of free Christian audiobooks. Filter by category, topic, or author. Sort by popularity, date, or duration.',
  openGraph: {
    title: 'Browse Free Christian Audiobooks | ScrollReader',
    description: 'Explore our full library of free Christian audiobooks. Filter by category, topic, or author.',
    url: 'https://scrollreader.com/audiobooks',
  },
  alternates: { canonical: 'https://scrollreader.com/audiobooks' },
};

export default function AudiobooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
