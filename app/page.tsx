import Form from "next/form";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookCover from "@/components/BookCover";
import MyLibraries from "@/components/MyLibraries";
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
    <div className="space-y-8">
      <Form action="/" role="search">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-balance">
          <label htmlFor="q">읽고 싶은 책, 내 도서관에 있을까</label>
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
            className="h-12 min-w-0 flex-1 rounded-md border border-control bg-card px-3.5 text-[17px] placeholder:text-muted hover:border-muted"
          />
          <button type="submit" className="h-12 shrink-0 rounded-md bg-ink px-5 text-[17px] font-semibold text-card hover:bg-ink/85 active:scale-[0.98]">
            찾기
          </button>
        </div>
      </Form>

      <MyLibraries />

      {q && (
        <section aria-label="검색 결과">
          {failed ? (
            <p className="rounded-lg bg-card p-4 text-warn">
              책 검색이 지금 안 돼요. 조회가 몰렸을 수 있어요. 잠시 뒤 다시 찾아 주세요.
            </p>
          ) : books.length === 0 ? (
            <p className="text-muted">
              ‘{q}’로 찾은 책이 없어요. 제목을 짧게 줄이거나 저자 이름으로 찾아 보세요. 책 뒤표지의 ISBN 13자리로도 찾을 수 있어요.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                같은 책도 출판사나 나온 해가 다르면 따로 나와요. 도서관마다 가진 판이 다를 수 있어요.
              </p>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg bg-card">
                {books.map((b) => (
                  <li key={b.isbn13}>
                    <Link href={`/book/${b.isbn13}`} className="flex gap-4 px-4 py-3.5 hover:bg-paper/50">
                      <BookCover src={b.cover} className="h-20 w-14" />
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{b.title}</p>
                        <p className="text-[15px] text-muted">{b.authors}</p>
                        <p className="text-[15px] text-muted">{[b.publisher, b.year].filter(Boolean).join(", ")}</p>
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
