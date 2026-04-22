import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Downloads',
  description: 'Your audiobooks saved for offline listening on Scroll Reader.',
  robots: { index: false, follow: false },
};

export default function DownloadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
