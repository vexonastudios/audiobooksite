import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Audiobook Topics',
  description: 'Discover free Christian audiobooks by topic — Prayer, Faith, Holiness, Evangelism, Suffering, and more.',
  openGraph: {
    title: 'Audiobook Topics | ScrollReader',
    description: 'Discover free Christian audiobooks by topic.',
    url: 'https://scrollreader.com/topics',
  },
  alternates: { canonical: 'https://scrollreader.com/topics' },
};

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
