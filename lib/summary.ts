// 책 화면 결론 한 줄. 도서관마다의 결과(못 받았으면 undefined, 정보나루가 실패하면 ok:false)를 세어 문장으로 만든다.
type Checked = { ok: true; hasBook: boolean; loanAvailable: boolean } | { ok: false } | undefined;

export function summaryLine(names: string[], results: Checked[]) {
  const ok = results.filter((r): r is Extract<Checked, { ok: true }> => !!r?.ok);
  if (!ok.length) return null; // 하나도 확인 못 했으면 결론을 말하지 않는다
  const n = names.length;
  const held = ok.filter((r) => r.hasBook).length;
  const available = ok.filter((r) => r.hasBook && r.loanAvailable).length;
  const unknown = n - ok.length;
  const one = n === 1 ? names[0] : null; // 1곳이면 "1곳 중 1곳" 대신 이름으로
  const line = available
    ? one
      ? `${one}에서 빌릴 수 있어요`
      : `내 도서관 ${n}곳 중 ${available}곳에서 빌릴 수 있어요`
    : held
      ? one
        ? `${one}에 있지만 모두 대출 중이에요`
        : `내 도서관 ${n}곳 중 ${held}곳에 있지만 모두 대출 중이에요`
      : one
        ? `${one}에는 이 책이 없어요`
        : unknown
          ? `확인한 ${ok.length}곳에는 이 책이 없어요`
          : `내 도서관 ${n}곳 모두 이 책이 없어요`;
  return { line, available, note: unknown ? `${unknown}곳은 확인하지 못했어요` : "" };
}
