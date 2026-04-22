import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support Scroll Reader and help cover ongoing costs like licensing fees, hosting, and server maintenance.',
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
