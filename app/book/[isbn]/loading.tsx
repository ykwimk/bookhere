import Skeleton, { ResultsSkeleton } from "@/components/Skeleton";

// 책 화면으로 넘어가는 동안의 뼈대. page.tsx + Availability 와 같은 배치·높이 (표지 92px 줄, 결론, 도서관 3줄).
// 데이터·API 를 부르지 않는 정적 부품으로 둔다: 검색 결과의 책 링크 미리 불러오기가 여기까지만 그려서 정보나루를 안 부른다.
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[92px] w-16 shrink-0 rounded-[4px]" />
        <div className="min-w-0 flex-1">
          <Skeleton className="my-1 h-5 w-4/5 rounded-md" />
          <Skeleton className="mt-[9px] mb-1 h-3.5 w-1/2 rounded" />
        </div>
      </div>
      <ResultsSkeleton />
    </div>
  );
}
