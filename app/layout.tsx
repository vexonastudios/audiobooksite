import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { LibraryProvider } from '@/components/providers/LibraryProvider';
import { AudioEngine } from '@/components/providers/AudioEngine';
import { SyncUserData } from '@/components/providers/SyncUserData';
import { LegacyFavoritesMigration } from '@/components/providers/LegacyFavoritesMigration';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { GlobalAudioPlayer } from '@/components/player/GlobalAudioPlayer';
import { TabBar } from '@/components/layout/TabBar';
import { PWAUpdater } from '@/components/ui/PWAUpdater';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'Scroll Reader - Free Christian Audiobooks',
    template: '%s | Scroll Reader',
  },
  description:
    "Scroll Reader offers free Christian audiobooks to revive your soul with the truth of God's Word. Listen to missionary biographies and other older books.",
  keywords: ['christian audiobooks', 'free audiobooks', 'missionary biographies', 'puritan audiobooks', 'reformed audiobooks'],
  metadataBase: new URL('https://scrollreader.com'),
  openGraph: {
    type: 'website',
    siteName: 'Scroll Reader',
    title: 'Scroll Reader - Free Christian Audiobooks',
    description: "Scroll Reader offers free Christian audiobooks to revive your soul with the truth of God's Word. Listen to missionary biographies and other older books.",
    url: 'https://scrollreader.com',
    locale: 'en_US',
    images: [
      {
        url: 'https://scrollreader.com/wp-content/uploads/scroll-reader-banner.webp',
        width: 2048,
        height: 1152,
        alt: 'Scroll Reader - Free Christian Audiobooks',
        type: 'image/webp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@scroll_reader',
    creator: '@scroll_reader',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large' as const,
    'max-snippet': -1,
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
        {/* Site-wide JSON-LD: Mirroring WordPress Yoast SEO perfectly to maintain rankings */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":"https://scrollreader.com/","url":"https://scrollreader.com/","name":"Scroll Reader - Free Christian Audiobooks","isPartOf":{"@id":"https://scrollreader.com/#website"},"about":{"@id":"https://scrollreader.com/#organization"},"datePublished":"2024-09-24T19:18:43+00:00","dateModified":"2024-09-30T21:54:06+00:00","description":"Scroll Reader offers free Christian audiobooks to revive your soul with the truth of God's Word. Listen to missionary biographies and other older books.","breadcrumb":{"@id":"https://scrollreader.com/#breadcrumb"},"inLanguage":"en-US","potentialAction":[{"@type":"ReadAction","target":["https://scrollreader.com/"]}]},{"@type":"BreadcrumbList","@id":"https://scrollreader.com/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home"}]},{"@type":"WebSite","@id":"https://scrollreader.com/#website","url":"https://scrollreader.com/","name":"Scroll Reader - Free Christian Audiobooks","description":"Free Christian Audiobooks","publisher":{"@id":"https://scrollreader.com/#organization"},"potentialAction":[{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://scrollreader.com/?s={search_term_string}"},"query-input":{"@type":"PropertyValueSpecification","valueRequired":true,"valueName":"search_term_string"}}],"inLanguage":"en-US"},{"@type":"Organization","@id":"https://scrollreader.com/#organization","name":"Scroll Reader - Free Christian Audiobooks","url":"https://scrollreader.com/","logo":{"@type":"ImageObject","inLanguage":"en-US","@id":"https://scrollreader.com/#/schema/logo/image/","url":"https://scrollreader.com/wp-content/uploads/cropped-cropped-cropped-1080x1080-logo-270x270-1.jpg","contentUrl":"https://scrollreader.com/wp-content/uploads/cropped-cropped-cropped-1080x1080-logo-270x270-1.jpg","width":512,"height":512,"caption":"Scroll Reader - Free Christian Audiobooks"},"image":{"@id":"https://scrollreader.com/#/schema/logo/image/"},"sameAs":["https://www.facebook.com/scrollreaderaudio","https://x.com/scroll_reader","https://www.youtube.com/@scrollreaderaudio","https://www.instagram.com/scrollreader/","https://podcasters.spotify.com/pod/show/scrollreader"]}]}`,
          }}
        />
        {/* Service Worker registration and update detection are handled by PWAUpdater below */}
        <ClerkProvider>
          <LibraryProvider>
            {/* Sync DB quotes + favorites for signed-in users */}
            <SyncUserData />
            {/* One-time migration of favorites from the old WordPress site */}
            <LegacyFavoritesMigration />
            {/* Apply user's theme preference (light/dark/system) to <html> */}
            <ThemeProvider />
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

            {/* PWA update toast — shown when a new SW version is waiting */}
            <PWAUpdater />
          </LibraryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
