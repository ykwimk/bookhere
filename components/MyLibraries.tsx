'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLibraries } from '@/lib/storage';
import type { Library } from '@/lib/types';

// 첫 화면의 "내 도서관" 카드. 아직 안 골랐으면 고르기로 안내한다.
export default function MyLibraries() {
  const [mine, setMine] = useState<Library[] | null>(null);
  useEffect(() => setMine(loadLibraries()), []);

  if (!mine) return <div className="h-12" />;
  if (!mine.length) {
    return (
      <div className="bg-card rounded-[20px] p-5">
        <p className="text-[15px]">
          자주 가는 도서관을 3곳까지 골라 두면, 책을 찾을 때 세 곳에 있는지 바로
          보여 드려요.
        </p>
        <Link
          href="/libraries"
          className="bg-accent-soft text-accent-ink hover:bg-accent mt-4 inline-flex min-h-11 items-center rounded-xl px-4 text-[15px] font-semibold hover:text-white active:scale-[0.98]"
        >
          내 도서관 고르기
        </Link>
      </div>
    );
  }
  return (
    <div className="bg-card rounded-[20px] px-5 pt-2 pb-5">
      <p className="text-muted flex items-center justify-between text-[14px] font-medium">
        내 도서관
        <Link
          href="/libraries"
          className="text-ink hover:text-accent inline-flex min-h-11 items-center px-1 underline underline-offset-4"
        >
          바꾸기
        </Link>
      </p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {mine.map((l) => (
          <li
            key={l.code}
            className="bg-paper rounded-full px-3.5 py-1.5 text-[15px] font-medium"
          >
            {l.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
