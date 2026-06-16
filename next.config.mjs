/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage signed URLs (any project subdomain).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
