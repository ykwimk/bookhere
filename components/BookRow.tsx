import Link from 'next/link';
import BookCover from './BookCover';
import { splitSeries } from '@/lib/parse';
import type { Book } from '@/lib/types';

// 제목 결과·문장 결과가 같이 쓰는 책 한 줄. 표지는 받은 그림 크기를 넘겨 키우지 않는다 (작은 표지는 작게 남는다).
// AI 이유가 있으면 이유가 먼저 크게 (바탕체), 제목은 그 아래 작게. 표지 칸도 더 크다
export default function BookRow({
  book,
  reason,
}: {
  book: Book;
  reason?: string;
}) {
  const { series, main } = splitSeries(book.title);
  const meta = [
    book.authors,
    [book.publisher, book.year].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Link
      href={`/book/${book.isbn13}`}
      className={`group border-line grid gap-4 border-t py-5 lg:gap-6 ${
        reason
          ? 'grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[160px_minmax(0,1fr)]'
          : 'grid-cols-[96px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)]'
      }`}
    >
      {book.cover ? (
        <div
          className={`flex items-start ${reason ? '' : 'h-[140px] lg:h-[160px]'}`}
        >
          <BookCover
            src={book.cover}
            className={`h-auto w-auto max-w-full shadow-[0_10px_18px_-12px_rgba(0,0,0,0.45)] ${reason ? 'max-h-[160px] lg:max-h-[220px]' : 'max-h-full'}`}
          />
        </div>
      ) : (
        <BookCover src="" className="h-[128px] w-[88px]" />
      )}
      {reason ? (
        <div className="min-w-0">
          <p className="font-book text-[19px] leading-normal font-bold tracking-[-0.01em] text-pretty lg:text-[21px]">
            {reason}
          </p>
          <p className="mt-3 text-[15px] leading-snug font-bold group-hover:underline group-hover:underline-offset-4">
            {series && (
              <span className="text-muted font-medium">{series} </span>
            )}
            {main}
          </p>
          <p className="text-muted mt-1 text-[13px]">{meta}</p>
        </div>
      ) : (
        <div className="min-w-0">
          {series && (
            <p className="font-book text-muted text-[14px] leading-snug">
              {series}
            </p>
          )}
          <p className="font-book text-[20px] leading-snug font-bold tracking-[-0.01em] text-balance group-hover:underline group-hover:underline-offset-4">
            {main}
          </p>
          <p className="text-muted mt-2 text-[13px]">{meta}</p>
        </div>
      )}
    </Link>
  );
}
