import Link from 'next/link';
import BookCover from './BookCover';
import type { Book } from '@/lib/types';

// 제목 결과·문장 결과가 같이 쓰는 책 한 줄. 표지는 받은 그림 크기를 넘겨 키우지 않는다 (작은 표지는 작게 남는다)
export default function BookRow({
  book,
  reason,
}: {
  book: Book;
  reason?: string;
}) {
  return (
    <Link
      href={`/book/${book.isbn13}`}
      className="group border-line grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-t py-5 lg:grid-cols-[112px_minmax(0,1fr)] lg:gap-5"
    >
      {book.cover ? (
        <div className="flex h-[140px] items-start lg:h-[160px]">
          <BookCover
            src={book.cover}
            className="h-auto max-h-full w-auto max-w-full shadow-[0_10px_18px_-12px_rgba(0,0,0,0.45)]"
          />
        </div>
      ) : (
        <BookCover src="" className="h-[128px] w-[88px]" />
      )}
      <div className="min-w-0">
        <p className="font-book text-[20px] leading-snug font-bold tracking-[-0.01em] text-balance group-hover:underline group-hover:underline-offset-4">
          {book.title}
        </p>
        {reason && (
          <p className="mt-2 text-[15px] leading-relaxed font-medium text-pretty">
            {reason}
          </p>
        )}
        <p className="text-muted mt-2 text-[13px]">
          {[
            book.authors,
            [book.publisher, book.year].filter(Boolean).join(', '),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Link>
  );
}
