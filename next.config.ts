import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns = supabaseUrl
  ? [new URL("/storage/v1/object/public/case-images/**", supabaseUrl)]
  : [];

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
