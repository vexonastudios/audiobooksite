import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles & Summaries',
  description: 'Read curated summaries and articles drawn from classic Christian literature available on Scroll Reader.',
  openGraph: {
    title: 'Articles & Summaries | Scroll Reader',
    description: 'Curated summaries and articles drawn from classic Christian literature.',
    url: 'https://scrollreader.com/articles',
  },
  alternates: { canonical: 'https://scrollreader.com/articles' },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
