'use client';

import Link from 'next/link';
import { useLibraries } from '@/lib/useLibraries';
import { ArrowRightIcon } from './Icons';

// 첫 화면의 "내 도서관". 아직 안 골랐으면 고르기로 안내한다. 상자 없이 글과 밑줄 링크로
export default function MyLibraries() {
  const mine = useLibraries();

  if (!mine) return <div className="h-12" />;
  if (!mine.length) {
    return (
      <div>
        <p className="text-[15px] font-extrabold">내 도서관</p>
        <p className="text-ink-2 mt-1.5 text-[14px] leading-relaxed">
          자주 가는 도서관을 3곳까지 골라 두면, 책을 찾을 때 세 곳에 있는지 바로
          보여 드려요.
        </p>
        <Link
          href="/libraries"
          className="text-ink inline-flex min-h-11 items-center text-[14px] font-bold underline underline-offset-4"
        >
          내 도서관 고르기
          <ArrowRightIcon className="ml-1 size-4" />
        </Link>
      </div>
    );
  }
  return (
    <div>
      <p className="flex items-center justify-between text-[15px] font-extrabold">
        내 도서관
        <Link
          href="/libraries"
          className="text-ink-2 hover:text-ink inline-flex min-h-11 items-center px-1 text-[14px] font-semibold underline underline-offset-4"
        >
          바꾸기
        </Link>
      </p>
      <ul className="flex flex-wrap gap-2">
        {mine.map((l) => (
          <li
            key={l.code}
            className="border-line rounded-full border px-3.5 py-1.5 text-[14px] font-medium"
          >
            {l.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
