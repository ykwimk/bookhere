import type { NextConfig } from 'next';

// verifier 조건 6·7: 이미지 최적화 끔(표지는 <img>), Cache Components·React Compiler 끔
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  cacheComponents: false,
  reactCompiler: false,
};

export default nextConfig;
