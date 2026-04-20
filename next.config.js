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
}

module.exports = nextConfig
