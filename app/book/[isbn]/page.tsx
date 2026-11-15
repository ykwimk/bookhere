import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Availability from '@/components/Availability';
import BookCover from '@/components/BookCover';
import { getBook, getLibrary } from '@/lib/data4library';
import { splitSeries } from '@/lib/parse';
import { isLibCode, parseIsbn } from '@/lib/validate';

type Props = {
  params: Promise<{ isbn: string }>;
  searchParams: Promise<{ lib?: string | string[] }>;
};

// ?lib=<도서관 코드> 는 공유한 사람이 고른 도서관 하나. 숫자인지만 보고, 이름은 API에서 받는다.
async function load({ params, searchParams }: Props) {
  const isbn = parseIsbn((await params).isbn);
  if (!isbn) notFound();
  const lib = (await searchParams).lib;
  const libCode = typeof lib === 'string' && isLibCode(lib) ? lib : null;
  const [book, shared] = await Promise.all([
    getBook(isbn).catch(() => null),
    libCode ? getLibrary(libCode).catch(() => null) : null,
  ]);
  return { isbn, book, shared };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { isbn, book, shared } = await load(props);
  const title = book?.title ?? `ISBN ${isbn}`;
  return {
    title,
    description: `${book ? `${title} (${book.authors})` : title} — 내가 다니는 도서관에 있는지, 어제 마감 때 빌릴 수 있었는지 바로 확인해요.`,
    // 공유 링크(?lib=)도 검색에는 책 화면 하나로 모은다
    alternates: { canonical: `/book/${isbn}` },
    openGraph: {
      title: `${title} | 책여기`,
      images: [`/og/${isbn}${shared ? `/${shared.code}` : ''}`],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function BookPage(props: Props) {
  const { isbn, book, shared } = await load(props);
  // 홈 결과 (BookRow) 와 같게: "(시리즈) 제목" 이면 시리즈를 제목 위에 작게
  const { series, main } = book
    ? splitSeries(book.title)
    : { series: '', main: '책 정보를 불러오지 못했어요' };
  return (
    <div className="space-y-8">
      <Availability
        isbn={isbn}
        shared={shared}
        head={
          <section className="flex items-center gap-4 lg:gap-6">
            {/* 홈 제목 결과 줄 (BookRow) 과 같은 표지 칸. 받은 그림보다 키우지 않는다 */}
            {book?.cover ? (
              <div className="flex h-[140px] w-24 shrink-0 items-start lg:h-[160px] lg:w-28">
                <BookCover
                  src={book.cover}
                  className="h-auto max-h-full w-auto max-w-full shadow-[0_10px_18px_-12px_rgba(0,0,0,0.45)]"
                />
              </div>
            ) : (
              <BookCover
                src=""
                className="h-[140px] w-24 lg:h-[160px] lg:w-28"
              />
            )}
            <div className="min-w-0">
              {series && (
                <p className="font-book text-muted text-[14px] leading-snug">
                  {series}
                </p>
              )}
              <h1 className="font-book text-[22px] leading-[1.35] font-bold tracking-[-0.01em] text-balance">
                {main}
              </h1>
              <p className="text-muted mt-1 text-[13px]">
                {book
                  ? [book.authors, book.publisher, book.year]
                      .filter(Boolean)
                      .join(' · ')
                  : '도서관 소장은 아래에서 그대로 확인할 수 있어요.'}
              </p>
            </div>
          </section>
        }
      />

      <p className="text-ink-2 text-[14px]">
        찾던 판이 아닌가요?{' '}
        <Link
          href={book ? `/?q=${encodeURIComponent(book.title)}` : '/'}
          className="text-ink font-semibold underline underline-offset-4"
        >
          다른 판 찾기
        </Link>
      </p>
    </div>
  );
}
