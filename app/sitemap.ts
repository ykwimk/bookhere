import type { MetadataRoute } from 'next';
import { popularBooks } from '@/lib/data4library';
import { SITE } from '@/lib/site';

export const revalidate = 86400; // 하루에 한 번 다시 만든다

// 책 화면은 인기 대출 100권만 알린다: 로봇이 책 화면을 열 때마다 정보나루 1건 (하루 500건 한도)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await popularBooks(100).catch(() => []); // 정보나루가 실패해도 첫 화면은 알린다
  return [
    { url: SITE.href, changeFrequency: 'daily', priority: 1 },
    ...books.map((b) => ({
      url: new URL(`/book/${b.isbn13}`, SITE).href,
      changeFrequency: 'daily' as const,
    })),
  ];
}
