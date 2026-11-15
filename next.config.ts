import type { NextConfig } from 'next';

// verifier 조건 6·7: 이미지 최적화 끔(표지는 <img>), Cache Components·React Compiler 끔
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  cacheComponents: false,
  reactCompiler: false,
  // 구글 검색 로봇에게도 title·canonical 을 <head> 안에 넣어 보낸다 (기본은 본문 뒤로 흘려보내 구글이 canonical 을 못 읽음).
  // Next 16.4.1 기본 목록 (next/dist/shared/lib/router/utils/html-bots.js) 을 그대로 복사하고 맨 앞에 Googlebot 만 더했다. 사람은 지금처럼 흘려보낸다
  htmlLimitedBots:
    /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight/i,
};

export default nextConfig;
