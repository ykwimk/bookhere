// 문장 찾기의 신뢰 경계: 사용자 문장, LLM 이 낸 조건·고른 책. 프롬프트에 맡기지 않고 여기 코드로 검사한다.
import type { Candidate, Conditions, Found, Pick } from './types.ts';

export const MAX_LEN = 200;
export const MAX_PICKS = 5;
export const MAX_REASON = 60;
export const MASK = '[지움]';

/** 가짜 llm 은 문장 앞 낱말을 그대로 조건으로 써서 문장 일부가 로그·정보나루 요청·캐시 키에 남는다.
 *  그래서 가짜면 Vercel 배포 (production·preview) 에서는 닫는다. 로컬 (없음·vercel env pull 의 development) 은 연다.
 *  라우트·/ask 화면·홈 링크가 같이 쓴다. */
export const askOpen = (promptVersion: string, vercelEnv: string | undefined) =>
  promptVersion !== 'fake' || !vercelEnv || vercelEnv === 'development';

// 주민번호를 먼저 지운다: 전화 꼴이 "010101-3234567" 의 앞부분을 먼저 먹지 않게
const PERSONAL = [
  /(?<!\d)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[-\s]?[1-8]\d{6}(?!\d)/g, // 주민·외국인등록번호 (월·일이 맞을 때만: ISBN 13자리는 안 걸림)
  /[\w.+-]+\s?@\s?[\w-]+(\.[\w-]+)+/g, // 이메일 ("abc @ naver.com" 도)
  /(?<!\d)\(?(?:\+?82[-.\s]?0?|0)\d{1,2}[-.\s)]{0,3}\d{3,4}[-.\s)]{0,3}\d{4}(?!\d)/g, // 휴대폰·지역번호 전화 (+82, 점·괄호·띄운 하이픈도)
];

/** 공백을 하나로, 200자 넘으면 null (→ 400). 전화·이메일·주민번호 꼴은 "[지움]" 으로 바꾸고 개수만 센다. */
export function cleanSentence(
  raw: unknown,
): { sentence: string; masked: number } | null {
  if (typeof raw !== 'string') return null;
  let sentence = raw.replace(/\s+/g, ' ').trim();
  if (!sentence || sentence.length > MAX_LEN) return null;
  let masked = 0;
  for (const re of PERSONAL) {
    sentence = sentence.replace(re, () => {
      masked++;
      return MASK;
    });
  }
  return { sentence, masked };
}

// 정보나루 매뉴얼 v20260620 20장 "코드" (58·59쪽). 연령 -1(미상) 은 모르면 null 이라 뺐다.
export const AGES = [
  '0',
  '6',
  '8',
  '14',
  '20',
  '30',
  '40',
  '50',
  '60',
  'a8',
  'a10',
  'a12',
  'a14',
  'a17',
];
export const ADD_CODES = ['0', '1', '2', '4', '5', '6', '7', '9'];
export const KDCS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const pickCode = (v: unknown, allowed: string[]) =>
  typeof v === 'string' && allowed.includes(v) ? v : null;

/** ① 결과 검사. 낱말은 공백·";" 없는 1~10자 최대 3개 (";" 는 정보나루 다중 낱말 구분자), "[지움]" 든 낱말은 버린다.
 *  코드는 허용 목록 밖이면 null. 넷 다 비면 null (→ ① 실패 "parse"). */
export function checkConditions(c: unknown): Conditions | null {
  const o = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
  const words = Array.isArray(o.keywords) ? o.keywords : [];
  const keywords = [
    ...new Set(
      words.filter(
        (w): w is string =>
          typeof w === 'string' &&
          /^[^\s;]{1,10}$/.test(w) &&
          !w.includes(MASK),
      ),
    ),
  ].slice(0, 3);
  const out = {
    keywords,
    age: pickCode(o.age, AGES),
    kdc: pickCode(o.kdc, KDCS),
    addCode: pickCode(o.addCode, ADD_CODES),
  };
  return keywords.length || out.age || out.kdc || out.addCode ? out : null;
}

/** LLM 에 보내는 칸 화이트리스트 (verifier 1a①). 표지 URL·책소개·대출 수는 넣지 않는다. 시험이 키 목록을 고정한다. */
export function toCandidate(f: Found): Candidate {
  return {
    isbn13: f.isbn13,
    title: f.title,
    authors: f.authors,
    publisher: f.publisher,
    year: f.year,
    classNm: f.classNm,
    addCode: f.addCode,
  };
}

/** ② 결과 검사: 후보 밖 ISBN 은 버리고 센다, 같은 ISBN 은 한 번, 5권까지, 이유는 60자에서 자르고 센다. */
export function checkPicks(
  picks: unknown,
  candidates: Candidate[],
): { picks: Pick[]; dropped: number; cut: number } {
  const known = new Set(candidates.map((c) => c.isbn13));
  const seen = new Set<string>();
  const out: Pick[] = [];
  let dropped = 0;
  let cut = 0;
  for (const p of Array.isArray(picks) ? picks : []) {
    const isbn13: unknown = p?.isbn13;
    if (typeof isbn13 !== 'string' || !known.has(isbn13)) {
      dropped++;
      continue;
    }
    if (seen.has(isbn13) || out.length >= MAX_PICKS) continue;
    seen.add(isbn13);
    const chars = [...(typeof p.reason === 'string' ? p.reason.trim() : '')];
    if (chars.length > MAX_REASON) cut++;
    out.push({ isbn13, reason: chars.slice(0, MAX_REASON).join('') });
  }
  return { picks: out, dropped, cut };
}
