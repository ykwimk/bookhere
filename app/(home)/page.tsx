import Link from "next/link";
import { redirect } from "next/navigation";
import BookCover from "@/components/BookCover";
import MyLibraries from "@/components/MyLibraries";
import SearchForm, { SearchButton } from "@/components/SearchForm";
import { searchBooks } from "@/lib/data4library";
import type { Book } from "@/lib/types";
import { parseIsbn } from "@/lib/validate";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function Home({ searchParams }: Props) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 100);

  // 책 뒤 ISBN을 입력했으면 바로 결과로 (978-89-… 처럼 하이픈을 넣어도 된다)
  const isbn = parseIsbn(q.replace(/[\s-]/g, ""));
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
    <div className="space-y-10">
      <SearchForm>
        <h1 className="text-[24px] font-bold leading-[1.35] tracking-[-0.02em]">
          <label htmlFor="q">
            읽고 싶은 책, <br />내 도서관에 있을까
          </label>
        </h1>
        <div className="mt-5 flex gap-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="제목, 저자, ISBN"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={100}
            required
            className="h-12 min-w-0 flex-1 rounded-xl border border-transparent bg-card px-4 text-[16px] placeholder:text-muted hover:border-control"
          />
          <SearchButton />
        </div>
        <Link href="/ask" className="mt-2 inline-flex min-h-11 items-center text-[15px] text-muted underline-offset-4 hover:text-ink hover:underline">
          제목을 모르면 문장으로 찾기 <span aria-hidden>&nbsp;→</span>
        </Link>
      </SearchForm>

      <MyLibraries />

      {q && (
        <section aria-label="검색 결과">
          {failed ? (
            <p className="rounded-[20px] bg-warn-soft p-5 text-warn">
              책 검색이 지금 안 돼요. 조회가 몰렸을 수 있어요. 잠시 뒤 다시 찾아 주세요.
            </p>
          ) : books.length === 0 ? (
            <p className="text-muted">
              ‘{q}’로 찾은 책이 없어요. 제목을 짧게 줄이거나 저자 이름으로 찾아 보세요. 책 뒤표지의 ISBN 13자리로도 찾을 수 있어요.
            </p>
          ) : (
            <>
              <p className="text-[14px] text-muted">
                같은 책도 출판사나 나온 해가 다르면 따로 나와요. 도서관마다 가진 판이 다를 수 있어요.
              </p>
              <ul className="-mx-3 mt-4 space-y-1">
                {books.map((b) => (
                  <li key={b.isbn13}>
                    <Link href={`/book/${b.isbn13}`} className="flex gap-4 rounded-[20px] p-3 hover:bg-card active:scale-[0.99]">
                      <BookCover src={b.cover} className="h-[92px] w-16" />
                      <div className="min-w-0 py-1">
                        <p className="text-[16px] font-semibold leading-snug">{b.title}</p>
                        <p className="mt-1 text-[14px] text-muted">{b.authors}</p>
                        <p className="text-[14px] text-muted">{[b.publisher, b.year].filter(Boolean).join(", ")}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
