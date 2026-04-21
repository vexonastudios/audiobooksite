import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Physical Books — Buy Print Editions',
  description: 'Find physical copies of every audiobook in our library. Links to Amazon, Granted Ministries, and more.',
  openGraph: {
    title: 'Physical Books | ScrollReader',
    description: 'Buy physical copies of the books in our free Christian audiobook library.',
    url: 'https://scrollreader.com/printed-books',
  },
  alternates: { canonical: 'https://scrollreader.com/printed-books' },
};

export default function PrintedBooksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
