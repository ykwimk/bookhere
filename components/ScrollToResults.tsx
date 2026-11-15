'use client';

import { useEffect, useRef } from 'react';

// PC 에서 제목 검색 뒤 결과 머리가 첫 화면 밖이면 (위에 문장 결과가 있을 때) 그 자리로 내려 준다.
// 휴대폰은 결과가 제목 칸 바로 아래라 건드리지 않는다 (SearchForm 의 scroll: false 그대로)
export default function ScrollToResults({ q }: { q: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(min-width: 64rem)').matches) return;
    if (el.getBoundingClientRect().top > innerHeight - 120)
      el.scrollIntoView({ block: 'start' });
  }, [q]);
  return <span ref={ref} aria-hidden className="block scroll-mt-8" />;
}
