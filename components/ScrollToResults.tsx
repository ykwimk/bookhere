'use client';

import { useEffect, useRef } from 'react';

// PC 에서 제목 검색 뒤 결과 머리가 화면 밖이면 그 자리로 옮겨 준다: 아래 (위에 문장 결과가 있을 때) 면 내리고,
// 위 (결과를 내린 채 따라오는 제목 칸으로 다시 찾았을 때) 면 올린다.
// 휴대폰은 결과가 제목 칸 바로 아래라 건드리지 않는다 (SearchForm 의 scroll: false 그대로)
export default function ScrollToResults({ q }: { q: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(min-width: 64rem)').matches) return;
    const top = el.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight - 120)
      el.scrollIntoView({ block: 'start' });
  }, [q]);
  return <span ref={ref} aria-hidden className="block scroll-mt-8" />;
}
