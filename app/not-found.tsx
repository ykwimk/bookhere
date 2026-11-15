import Link from 'next/link';

// 없는 주소. Next 기본 404 는 브라우저가 어두운 모드면 바탕을 검게 칠해 먹색 로고·바닥글이 안 보여서 직접 둔다.
// 머리줄·바닥글은 layout 그대로, 본문은 다른 좁은 화면처럼 로고 아래 왼쪽 36rem
export default function NotFound() {
  return (
    <div>
      <h1 className="text-[22px] leading-[1.35] font-extrabold tracking-[-0.03em] lg:text-[26px]">
        찾는 화면이 없어요
      </h1>
      <p className="mt-2">
        <Link
          href="/"
          className="text-ink inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-4"
        >
          처음으로
        </Link>
      </p>
    </div>
  );
}
