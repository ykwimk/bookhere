// 정보나루 JSON 응답을 화면용 모양으로 바꾼다.
// 응답 모양은 2026-10 실제 응답으로 확인했다.
import type { Book, Library } from './types';
import type { Found } from './ask/types';

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});
const str = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';

// 목록 항목은 { lib: {...} } / { doc: {...} } 로 한 번 더 감싸져 온다 (확인됨). 감싸지 않은 모양도 받는다.
function list(
  body: unknown,
  key: 'libs' | 'docs',
  inner: 'lib' | 'doc',
): Obj[] {
  const arr = obj(obj(body).response)[key];
  return Array.isArray(arr) ? arr.map((x) => obj(obj(x)[inner] ?? x)) : [];
}

/** 링크·이미지로 쓸 주소. http(s)만 남기고 "www.x.kr" 처럼 스킴이 없으면 http를 붙인다. javascript: 등은 버린다. */
export function safeUrl(v: unknown): string {
  const s = str(v);
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(s)) return `http://${s}`;
  return '';
}

/** 정보나루 오류는 HTTP 200 본문: { response: { errCode, error } } (확인됨 10/27: vitalizationErr, authErr) */
export const isApiError = (body: unknown) => {
  const r = obj(obj(body).response);
  return !obj(body).response || 'error' in r || 'errCode' in r;
};

export function parseLibraries(body: unknown, region = ''): Library[] {
  return list(body, 'libs', 'lib')
    .map((l) => ({
      code: str(l.libCode),
      name: str(l.libName),
      address: str(l.address),
      homepage: safeUrl(l.homepage),
      region,
    }))
    .filter((l) => l.code && l.name);
}

/** 화면용 제목: "소년이 온다 :한강 장편소설"·"채식주의자:한강 연작소설" → 앞부분 (":" 부제, "=" 대등 제목을 뗀다).
 *  쌍점 바로 앞이 공백이나 한글일 때만 뗀다: "Re:제로부터 시작하는 이세계 생활" 은 그대로.
 *  뒤돌아보기(?<=) 는 쓰지 않는다: storage.ts 를 거쳐 브라우저에도 실리고, 옛 사파리(16.4 미만)는 문법 오류로 멈춘다. */
export const shortTitle = (t: string) =>
  t.replace(/([\s가-힣])[:=].*$/, '$1').trim() || t;

/** 책 줄의 제목: 맨 앞 괄호 "(학교에 간 공룡) 앨리사우루스" → 부제 "학교에 간 공룡" + 본 제목 "앨리사우루스".
 *  괄호가 없거나 제목 전체가 괄호면 그대로 (부제 없음). */
export function splitSeries(t: string): { series: string; main: string } {
  const m = /^\(([^)]+)\)\s*(\S.*)$/.exec(t.trim());
  return m
    ? { series: m[1].trim(), main: m[2].trim() }
    : { series: '', main: t };
}

/** 화면용 저자: "지은이: 한강 ;옮긴이: …" → "한강". 첫 사람(들)만, 역할 이름표와 " 지음"을 뗀다. */
export const shortAuthors = (a: string) =>
  a
    .split(';')[0]
    .trim()
    .replace(/^[^:]{1,6}:\s*/, '')
    .replace(/\s+(지음|저|글)$/, '') || a;

/** 검색 응답 여러 개를 합쳐 대출 많은 순으로, 같은 ISBN은 한 번만. 제목·저자는 원래 글 그대로 (문장 찾기 후보). */
export function parseFound(...bodies: unknown[]): Found[] {
  const seen = new Set<string>();
  return bodies
    .flatMap((b) => list(b, 'docs', 'doc'))
    .map((d) => ({
      isbn13: str(d.isbn13),
      title: str(d.bookname),
      authors: str(d.authors),
      publisher: str(d.publisher),
      year: str(d.publication_year),
      classNm: str(d.class_nm), // "문학 > 한국문학 > 소설" (확인됨 11/9)
      addCode: str(d.addition_symbol), // 부가기호 5자리 "77810", 첫 자리 = 독자 대상 (확인됨 11/9)
      classNo: str(d.class_no), // KDC "813.7"
      cover: safeUrl(d.bookImageURL),
      loans: Number(str(d.loan_count)) || 0,
    }))
    .sort((a, b) => b.loans - a.loans)
    .filter(
      (b) =>
        /^\d{13}$/.test(b.isbn13) &&
        b.title &&
        !seen.has(b.isbn13) &&
        !!seen.add(b.isbn13),
    );
}

/** 화면용 책 한 권: 제목·저자를 짧게. */
export const toBook = (f: Found): Book => ({
  isbn13: f.isbn13,
  title: shortTitle(f.title),
  authors: shortAuthors(f.authors),
  publisher: f.publisher,
  year: f.year,
  cover: f.cover,
});

/** 검색 응답 여러 개를 합쳐 대출 많은 순으로, 같은 ISBN은 한 번만. */
export const parseBooks = (...bodies: unknown[]): Book[] =>
  parseFound(...bodies).map(toBook);

// 실제 값은 "Y"/"N" 문자열 (확인됨 10/28). true/false 도 받는다.
const yes = (v: unknown) =>
  v === true || v === 'Y' || v === 'y' || v === 'true';

/** bookExist → result.hasBook, result.loanAvailable. 필드가 없으면 null (= 확인 못 함). */
export function parseBookExist(
  body: unknown,
): { hasBook: boolean; loanAvailable: boolean } | null {
  const r = obj(obj(obj(body).response).result);
  if (!('hasBook' in r)) return null;
  const hasBook = yes(r.hasBook);
  return { hasBook, loanAvailable: hasBook && yes(r.loanAvailable) };
}
