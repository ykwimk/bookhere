import Skeleton from "@/components/Skeleton";

// 첫 화면(/?q= 검색 포함)·내 도서관 고르기로 넘어가는 동안. 두 화면 공통인 큰 제목 + 입력 칸 자리만 그린다 (정적 부품)
// 루트(app/loading.tsx)에 두지 않는 이유: 책 화면 이동 때 이 모양이 책 뼈대보다 먼저 잠깐 보인다 (미리 불러오기는 첫 loading 경계까지)
export default function Loading() {
  return (
    <div>
      <p role="status" className="sr-only">
        찾는 중…
      </p>
      <Skeleton className="my-1.5 h-5 w-3/5 rounded-md" />
      <Skeleton className="my-1.5 h-5 w-2/5 rounded-md" />
      <Skeleton className="mt-5 h-12 rounded-xl" />
    </div>
  );
}
