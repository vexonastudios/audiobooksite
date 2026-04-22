/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor (mobile apps)
  // Uncomment BOTH lines below when building for Capacitor:
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'scrollreader.com' },
      { protocol: 'https', hostname: 'audio.scrollreader.com' },
    ],
  },
  // Prevent Next.js from bundling packages that ship native binaries.
  // ffmpeg-static contains a platform binary that must exist as a real file on disk.
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static'],
}

module.exports = nextConfig
