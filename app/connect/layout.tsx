import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect — Follow, Subscribe & Listen on Podcast Apps',
  description:
    'Follow Scroll Reader on social media, subscribe for monthly email updates, or listen to our free Christian audiobooks on Spotify, Apple Podcasts, and YouTube.',
  alternates: { canonical: 'https://scrollreader.com/connect' },
  openGraph: {
    title: 'Connect with Scroll Reader | ScrollReader',
    description:
      'Follow Scroll Reader on social media, subscribe for monthly email updates, or listen on Spotify, Apple Podcasts, and YouTube.',
    url: 'https://scrollreader.com/connect',
  },
};

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
