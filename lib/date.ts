const fmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
});

/**
 * 대출 가능 여부의 기준일 = 정보나루가 응답한 날(한국 시간)의 전날. 예: "10월 26일(월)", short 면 "10/26".
 * 응답 시각을 쓰는 이유: 캐시된 응답이면 오늘의 "어제"와 다를 수 있다.
 */
export function loanBaseLabel(checkedAt: Date, short = false): string {
  const p = Object.fromEntries(
    fmt
      .formatToParts(new Date(checkedAt.getTime() - 86_400_000))
      .map((x) => [x.type, x.value]),
  );
  return short
    ? `${p.month}/${p.day}`
    : `${p.month}월 ${p.day}일(${p.weekday})`;
}
