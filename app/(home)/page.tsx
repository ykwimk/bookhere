import { redirect } from 'next/navigation';
import BookRow from '@/components/BookRow';
import Finder from '@/components/Finder';
import { searchBooks } from '@/lib/data4library';
import { parseIsbn } from '@/lib/validate';
import type { Book } from '@/lib/types';

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function Home({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (typeof raw === 'string' ? raw : '').trim().slice(0, 100);

  // 책 뒤 ISBN을 입력했으면 바로 결과로 (978-89-… 처럼 하이픈을 넣어도 된다)
  const isbn = parseIsbn(q.replace(/[\s-]/g, ''));
  if (isbn) redirect(`/book/${isbn}`);

  let books: Book[] = [];
  let failed = false;
  if (q) {
    try {
      books = await searchBooks(q);
    } catch {
      failed = true;
    }
  }

  return (
    <Finder q={q}>
      {q && (
        <section aria-label="검색 결과">
          {failed ? (
            <p className="text-warn border-warn border-t pt-4">
              책 검색이 지금 안 돼요. 조회가 몰렸을 수 있어요. 잠시 뒤 다시 찾아
              주세요.
            </p>
          ) : books.length === 0 ? (
            <p className="text-ink-2">
              ‘{q}’로 찾은 책이 없어요. 제목을 짧게 줄이거나 저자 이름으로 찾아
              보세요. 책 뒤표지의 ISBN 13자리로도 찾을 수 있어요.
            </p>
          ) : (
            <>
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">
                ‘{q}’ 제목으로 찾은 책{' '}
                <span className="text-muted font-semibold">
                  {books.length}권
                </span>
              </h2>
              <p className="text-ink-2 mt-1 text-[13px]">
                같은 책도 출판사나 나온 해가 다르면 따로 나와요. 도서관마다 가진
                판이 다를 수 있어요.
              </p>
              <ul className="mt-4 lg:grid lg:grid-cols-2 lg:gap-x-10">
                {books.map((b) => (
                  <li key={b.isbn13}>
                    <BookRow book={b} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </Finder>
  );
}
