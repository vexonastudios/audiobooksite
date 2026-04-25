/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor (mobile apps)
  // Uncomment BOTH lines below when building for Capacitor:
  // output: 'export',
  // trailingSlash: true,

  images: {
    // Keep unoptimized: true ONLY when building for Capacitor (output: 'export').
    // For web (Vercel), leave this false so Vercel's Image CDN serves WebP + responsive sizes.
    // unoptimized: true,
    remotePatterns: [
      // Legacy WordPress origin — can be removed once image migration to R2 is complete
      { protocol: 'https', hostname: 'scrollreader.com' },
      // R2 audio/image CDN
      { protocol: 'https', hostname: 'audio.scrollreader.com' },
      // Clerk user avatars
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },

  // Prevent Next.js from bundling packages that ship native binaries.
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static', '@ffprobe-installer/ffprobe'],

  // Moved from experimental (was deprecated in Next.js 16)
  outputFileTracingIncludes: {
    '/api/admin/generate-64k':   ['./node_modules/ffmpeg-static/**/*', './node_modules/@ffprobe-installer/**/*'],
    '/api/admin/process-audio':  ['./node_modules/ffmpeg-static/**/*', './node_modules/@ffprobe-installer/**/*'],
  },
}

module.exports = nextConfig
