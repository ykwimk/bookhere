// 표지는 <img> 로만 보여 준다 (verifier 조건 6: 이미지 최적화를 쓰지 않음). 제목이 옆에 있으므로 alt 는 비운다.
// 표지가 없으면 책등이 있는 옅은 색 판으로 책 모양만 남긴다.
export default function BookCover({ src, className = "" }: { src: string; className?: string }) {
  const box = `shrink-0 rounded-[4px] ${className}`;
  return src ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`${box} bg-raised object-cover outline -outline-offset-1 outline-black/5`}
    />
  ) : (
    <div aria-hidden className={`${box} border-l-[6px] border-[#c9e5d3] bg-accent-soft`} />
  );
}
