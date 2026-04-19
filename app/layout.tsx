import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { LibraryProvider } from '@/components/providers/LibraryProvider';
import { AudioEngine } from '@/components/providers/AudioEngine';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { GlobalAudioPlayer } from '@/components/player/GlobalAudioPlayer';
import { TabBar } from '@/components/layout/TabBar';

export const metadata: Metadata = {
  title: {
    default: 'ScrollReader — Free Christian Audiobooks',
    template: '%s | ScrollReader',
  },
  description:
    'Listen to hundreds of free Christian audiobooks from classic authors like C.H. Spurgeon, Hudson Taylor, George Müller, Amy Carmichael, and more.',
  keywords: ['christian audiobooks', 'free audiobooks', 'missionary biographies', 'puritan audiobooks'],
  metadataBase: new URL('https://scrollreader.com'),
  openGraph: {
    type: 'website',
    siteName: 'ScrollReader',
    title: 'ScrollReader — Free Christian Audiobooks',
    description: 'Hundreds of free classic Christian audiobooks.',
    url: 'https://scrollreader.com',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#5B4CF5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ClerkProvider>
          <LibraryProvider>
            {/* Global audio event bridge */}
            <AudioEngine />

            <div className="app-shell">
              <Sidebar />
              <main className="main-content">
                <TopBar />
                {children}
              </main>
            </div>

            {/* Mobile bottom tab navigation */}
            <TabBar />

            {/* Persistent audio player — never unmounts */}
            <GlobalAudioPlayer />
          </LibraryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
