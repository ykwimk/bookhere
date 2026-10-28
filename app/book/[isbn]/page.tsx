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
    description: `${book ? `${title} (${book.authors})` : title} — 내가 다니는 도서관에 있는지, 어제 마감 때 빌릴 수 있었는지 바로 확인해요.`,
    // 공유 링크(?lib=)도 검색에는 책 화면 하나로 모은다
    alternates: { canonical: `/book/${isbn}` },
    openGraph: { title: `${title} | 책여기`, images: [`/og/${isbn}${shared ? `/${shared.code}` : ""}`] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BookPage(props: Props) {
  const { isbn, book, shared } = await load(props);
  return (
    <div className="space-y-8">
      <Availability
        isbn={isbn}
        shared={shared}
        head={
          <section className="flex items-center gap-4">
            <BookCover src={book?.cover ?? ""} className="h-[92px] w-16" />
            <div className="min-w-0">
              <h1 className="text-[20px] font-bold leading-[1.35] tracking-[-0.02em] text-balance">
                {book?.title ?? "책 정보를 불러오지 못했어요"}
              </h1>
              <p className="mt-1 text-[14px] text-muted">
                {book
                  ? [book.authors, book.publisher, book.year].filter(Boolean).join(" · ")
                  : "도서관 소장은 아래에서 그대로 확인할 수 있어요."}
              </p>
            </div>
          </section>
        }
      />

      <p className="text-[14px] text-muted">
        찾던 판이 아닌가요?{" "}
        <Link href={book ? `/?q=${encodeURIComponent(book.title)}` : "/"} className="font-medium text-ink underline underline-offset-4 hover:text-accent">
          다른 판 찾기
        </Link>
      </p>
    </div>
  );
}
