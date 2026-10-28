"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Library } from "@/lib/types";
import { loadLibraries } from "@/lib/storage";

// 첫 화면의 "내 도서관" 카드. 아직 안 골랐으면 고르기로 안내한다.
export default function MyLibraries() {
  const [mine, setMine] = useState<Library[] | null>(null);
  useEffect(() => setMine(loadLibraries()), []);

  if (!mine) return <div className="h-12" />;
  if (!mine.length) {
    return (
      <div className="rounded-[20px] bg-card p-6">
        <p className="text-[16px]">자주 가는 도서관을 3곳까지 골라 두면, 책을 찾을 때 세 곳에 있는지 바로 보여 드려요.</p>
        <Link
          href="/libraries"
          className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent-soft px-5 font-bold text-accent-ink hover:bg-accent hover:text-white active:scale-[0.98]"
        >
          내 도서관 고르기
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-[20px] bg-card px-5 pt-2 pb-5">
      <p className="flex items-center justify-between text-[15px] font-semibold text-muted">
        내 도서관
        <Link href="/libraries" className="inline-flex min-h-11 items-center px-1 text-ink underline underline-offset-4 hover:text-accent">
          바꾸기
        </Link>
      </p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {mine.map((l) => (
          <li key={l.code} className="rounded-full bg-paper px-4 py-2 text-[15px] font-bold">
            {l.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
