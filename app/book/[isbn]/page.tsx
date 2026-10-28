import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Availability from "@/components/Availability";
import BookCover from "@/components/BookCover";
import { getBook, getLibrary } from "@/lib/data4library";
import { isLibCode, parseIsbn } from "@/lib/validate";

type Props = {
  params: Promise<{ isbn: string }>;
  searchParams: Promise<{ lib?: string | string[] }>;
};

// ?lib=<도서관 코드> 는 공유한 사람이 고른 도서관 하나. 숫자인지만 보고, 이름은 API에서 받는다.
async function load({ params, searchParams }: Props) {
  const isbn = parseIsbn((await params).isbn);
  if (!isbn) notFound();
  const lib = (await searchParams).lib;
  const libCode = typeof lib === "string" && isLibCode(lib) ? lib : null;
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
    openGraph: { title: `${title} | 책여기`, images: [`/og/${isbn}${shared ? `/${shared.code}` : ""}`] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BookPage(props: Props) {
  const { isbn, book, shared } = await load(props);
  return (
    <div className="space-y-8">
      <section className="flex gap-4">
        <BookCover src={book?.cover ?? ""} className="h-32 w-[88px]" />
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-balance">{book?.title ?? "책 정보를 불러오지 못했어요"}</h1>
          {book ? (
            <>
              <p className="mt-1.5 text-[15px] text-muted">{book.authors}</p>
              <p className="text-[15px] text-muted">{[book.publisher, book.year].filter(Boolean).join(", ")}</p>
            </>
          ) : (
            <p className="text-[15px] text-muted">도서관 소장은 아래에서 그대로 확인할 수 있어요.</p>
          )}
          <p className="mt-1 text-sm text-muted tabular-nums">ISBN {isbn}</p>
        </div>
      </section>

      <Availability isbn={isbn} shared={shared} />

      <p className="text-[15px] text-muted">
        찾던 판이 아닌가요?{" "}
        <Link href={book ? `/?q=${encodeURIComponent(book.title)}` : "/"} className="text-ink underline underline-offset-2 hover:text-muted">
          다른 판 찾기
        </Link>
      </p>
    </div>
  );
}
