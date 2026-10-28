// 표지는 <img> 로만 보여 준다 (verifier 조건 6: 이미지 최적화를 쓰지 않음). 제목이 옆에 있으므로 alt 는 비운다.
// 표지가 없으면 옅은 색 판으로 책 모양을 남기고, 큰 표지(title 을 넘긴 곳)에는 제목을 적는다. 글자 크기는 표지 너비를 따른다 (cqw).
export default function BookCover({ src, title, className = "" }: { src: string; title?: string; className?: string }) {
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
    <div aria-hidden className={`${box} @container border-l-[6px] border-[#bfe0fa] bg-accent-soft`}>
      {title && <p className="line-clamp-5 p-[9cqw] text-[clamp(12px,12cqw,17px)] font-bold leading-snug text-accent-ink">{title}</p>}
    </div>
  );
}
