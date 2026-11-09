// 후보 찾기의 순수 부분 (정보나루 인자·파싱·거르기). 앱 (lib/data4library.ts findCandidates) 과 평가 스냅샷 (eval/run.ts) 이 같이 쓴다.
// 문장은 정보나루 인자에 넣지 않는다: 인자는 하루 캐시 키가 된다 (data4library.ts call).
import type { Conditions, Found } from "./types.ts";
import { parseFound } from "../parse.ts";

export const MAX_CANDIDATES = 50; // verifier 1a② 한 번에 보내는 후보 상한
const MIN_AFTER_FILTER = 5;

type Get = (api: string, params: Record<string, string>) => Promise<unknown>;

/** 낱말이 있으면 srchBooks, 0권이고 연령·주제가 있으면 loanItemSrch. 요청당 정보나루 많아야 2건. */
export async function searchCandidates(get: Get, c: Conditions, now: number): Promise<{ found: Found[]; calls: number }> {
  let calls = 0;
  let found: Found[] = [];
  if (c.keywords.length) {
    calls++;
    // 확인됨 (11/9 실제 응답): keyword 를 ";" 로 여럿 넣으면 그리고(AND). 공룡 2,118권·그림책 22,475권 → "공룡;그림책" 525권
    found = parseFound(await get("srchBooks", { keyword: c.keywords.join(";"), pageNo: "1", pageSize: String(MAX_CANDIDATES) }));
  }
  if (!found.length && (c.age || c.kdc)) {
    calls++;
    // 기간 없이 물으면 8초 안에 안 온다 (popularBooks 와 같은 최근 30일)
    const day = (n: number) => new Date(now - n * 864e5).toISOString().slice(0, 10);
    const p: Record<string, string> = { startDt: day(31), endDt: day(1), pageNo: "1", pageSize: String(MAX_CANDIDATES) };
    if (c.age) p.age = c.age;
    if (c.kdc) p.kdc = c.kdc;
    if (c.addCode) p.addCode = c.addCode;
    found = parseFound(await get("loanItemSrch", p));
  }
  return { found: found.slice(0, MAX_CANDIDATES), calls };
}

/** 부가기호 첫 자리 (독자 대상, 7=아동)·KDC 앞자리로 거른다. 남는 게 5권 미만이면 거르지 않는다. */
export function narrow(found: Found[], c: Conditions): { list: Found[]; removed: number } {
  const kept = found.filter(
    (f) => (!c.addCode || f.addCode.startsWith(c.addCode)) && (!c.kdc || f.classNo.startsWith(c.kdc)),
  );
  const list = kept.length >= MIN_AFTER_FILTER ? kept : found;
  return { list, removed: found.length - list.length };
}
