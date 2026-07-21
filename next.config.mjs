/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Image Optimization was previously disabled (`unoptimized: true`), so the
    // ~3 MB source PNGs in /public were served raw at full resolution. With it
    // on, Next resizes each image to the width it's actually rendered at and
    // serves AVIF/WebP instead of PNG.
    formats: ['image/avif', 'image/webp'],
    // Admin-uploaded product and About-page images live on Vercel Blob.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
