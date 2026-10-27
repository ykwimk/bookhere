// 표지는 <img> 로만 보여 준다 (verifier 조건 6: 이미지 최적화를 쓰지 않음). 제목이 옆에 있으므로 alt 는 비운다.
export default function BookCover({ src, className = "" }: { src: string; className?: string }) {
  const box = `shrink-0 rounded-sm border border-line bg-line/40 ${className}`;
  return src ? (
    <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className={`${box} object-cover`} />
  ) : (
    <div aria-hidden className={box} />
  );
}
