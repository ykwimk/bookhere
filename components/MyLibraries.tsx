"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Library } from "@/lib/types";
import { loadLibraries } from "@/lib/storage";

// 첫 화면의 "내 도서관" 한 줄. 아직 안 골랐으면 고르기로 안내한다.
export default function MyLibraries() {
  const [mine, setMine] = useState<Library[] | null>(null);
  useEffect(() => setMine(loadLibraries()), []);

  if (!mine) return <div className="h-12" />;
  if (!mine.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-4">
        <p className="text-[15px]">자주 가는 도서관을 3곳까지 골라 두면, 책을 찾을 때 세 곳에 있는지 바로 보여 드려요.</p>
        <Link
          href="/libraries"
          className="mt-3 inline-flex min-h-11 items-center rounded-md bg-shelf px-4 font-semibold text-white"
        >
          내 도서관 고르기
        </Link>
      </div>
    );
  }
  return (
    <p className="text-[15px] text-muted">
      내 도서관: <span className="text-ink">{mine.map((l) => l.name).join(", ")}</span>{" "}
      <Link href="/libraries" className="inline-flex min-h-11 items-center px-1 text-shelf underline underline-offset-2">
        바꾸기
      </Link>
    </p>
  );
}
