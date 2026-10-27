import type { Metadata } from "next";
import LibraryPicker from "@/components/LibraryPicker";
import { parseIsbn } from "@/lib/validate";

export const metadata: Metadata = { title: "내 도서관 고르기" };

type Props = { searchParams: Promise<{ from?: string | string[] }> };

// ?from=<isbn> 이면 다 고른 뒤 그 책 결과로 돌아간다 (숫자 검사로 다른 주소로 보내는 것을 막음)
export default async function LibrariesPage({ searchParams }: Props) {
  const from = (await searchParams).from;
  return <LibraryPicker returnIsbn={typeof from === "string" ? parseIsbn(from) : null} />;
}
