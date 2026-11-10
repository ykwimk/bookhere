// 책 화면 아이콘. 경로는 Lucide (https://lucide.dev, ISC 라이선스, Copyright (c) Lucide Contributors) 에서 옮겼다.
// 모두 장식이라 aria-hidden: 뜻은 옆의 글자나 aria-label 이 말한다.
import type { ReactNode } from 'react';

function Icon({
  children,
  className = 'size-4',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const HourglassIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </Icon>
);

export const MinusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

// Lucide loader-circle. 돌리는 것은 부르는 쪽 (motion-safe:animate-spin)
export const SpinnerIcon = (p: P) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </Icon>
);

export const ArrowUpRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Icon>
);

export const CalendarIcon = (p: P) => (
  <Icon {...p}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </Icon>
);

export const ShareIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 2v13" />
    <path d="m16 6-4-4-4 4" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
  </Icon>
);
