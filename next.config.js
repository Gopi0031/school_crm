/** @type {import('next').NextConfig} */
const nextConfig = {
 // ✅ Updated
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    }
  ]
}
}

module.exports = nextConfig;