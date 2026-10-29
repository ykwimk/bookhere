// 기다리는 동안 자리만 잡는 회색 막대. 화면 읽기에는 숨기고, 부르는 쪽이 읽을 글(sr-only)을 따로 둔다.
// 훅이 없어 서버(loading.tsx)와 클라이언트(Availability) 양쪽에서 쓴다. 크기·모서리는 부르는 쪽이 정한다.
export default function Skeleton({ className }: { className: string }) {
  return <span aria-hidden className={`block bg-raised motion-safe:animate-pulse ${className}`} />;
}

// 책 화면 결론 한 줄(20px·1.4 = 28px) + 기준일 줄(13px, mt-1) 자리. 결과가 들어와도 아래가 밀리지 않게 같은 높이
export function SummarySkeleton() {
  return (
    <>
      <Skeleton className="my-[3px] h-[22px] w-3/5 rounded-md" />
      <Skeleton className="mt-2 mb-1 h-3 w-28 rounded" />
    </>
  );
}

// 도서관 줄 오른쪽 상태 알약 자리 ("대출 가능" 알약과 같은 높이)
export const BadgeSkeleton = () => <Skeleton className="h-8 w-20 shrink-0 rounded-full" />;

// 책 화면 결과 자리 통째: 결론 + 도서관 3줄 카드. 도서관 이름을 아직 모를 때 (loading.tsx, 내 도서관 읽기 전)
export function ResultsSkeleton() {
  return (
    <section>
      <p role="status" className="sr-only">
        불러오는 중…
      </p>
      <SummarySkeleton />
      <ul aria-hidden className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] bg-card">
        {["w-32", "w-40", "w-28"].map((w) => (
          <li key={w} className="flex min-h-14 items-center justify-between gap-3 px-5 py-2.5">
            <Skeleton className={`h-4 rounded ${w}`} />
            <BadgeSkeleton />
          </li>
        ))}
      </ul>
    </section>
  );
}
