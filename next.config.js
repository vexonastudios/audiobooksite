/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor (mobile apps)
  // Comment out 'output' line when running dev server
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'scrollreader.com' },
      { protocol: 'https', hostname: 'audio.scrollreader.com' },
    ],
  },
}

module.exports = nextConfig
