// 도서관 정보나루 Open API. 서버 전용: 라우트 핸들러와 서버 컴포넌트에서만 import 한다.
// 인증키(DATA4LIBRARY_KEY)는 서버 환경변수에서만 읽는다. 없으면 lib/mock 의 가짜 데이터를 돌려준다.
// API 이름·파라미터·응답 모양은 10/28 인증키로 실제 응답을 받아 확인했다.
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { searchCandidates } from './ask/find';
import {
  isApiError,
  parseBookExist,
  parseBooks,
  parseLibraries,
} from './parse';
import { parseIsbn } from './validate';
import { SIDO } from './regions';
import * as mock from './mock/data';
import type { Availability, Book, Library } from './types';
import type { Conditions, Found } from './ask/types';

const BASE = 'https://data4library.kr/api'; // 확인됨 (10/27 https 200). 키가 쿼리에 들어가므로 http는 쓰지 않는다
const DAY = 60 * 60 * 24;
const KEY = process.env.DATA4LIBRARY_KEY;

export const isMock = !KEY;

export class ApiError extends Error {}

// 확인됨 (README 확인 목록 6): 정보나루는 오류도 HTTP 200 + { response: { errCode, error } } 로 준다 → 성공만 캐시.
// fetch 캐시 대신 unstable_cache: fetchApi 가 throw 하면 저장하지 않고, 기간이 지난 값을 다시 받다 실패하면 이전 성공 값을 준다.
// 캐시 키는 fetchApi 의 인자(api, params)다. 인증키는 인자에 넣지 않는다 (Next 가 키를 로그에 찍을 수 있다).
// bookExist 의 hasBook 없는 정상 응답(오류 아님)은 캐시된다: 같은 요청엔 같은 답이라 그대로 둔다.
function call(api: string, params: Record<string, string>, revalidate: number) {
  return unstable_cache(fetchApi, [], { revalidate })(api, params);
}

async function fetchApi(api: string, params: Record<string, string>) {
  const url = `${BASE}/${api}?${new URLSearchParams({ ...params, authKey: KEY ?? '', format: 'json' })}`;
  // 오류·로그에 url 이나 오류 객체를 통째로 넣지 않는다: url 에 인증키가 있다
  let res: Response;
  try {
    res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error(
      `[data4library] ${api} 연결 실패 (${e instanceof Error ? e.name : 'unknown'})`,
    );
    throw new ApiError(api);
  }
  if (!res.ok) {
    console.error(`[data4library] ${api} HTTP ${res.status}`);
    throw new ApiError(api);
  }
  const body: unknown = await res.json().catch(() => null);
  // 한도 초과 응답 모양은 미확인: 시·도 도서관 목록이 비면 오류로 보고 캐시하지 않는다 (빈 목록이 7일 남으면 그 시·도 전체가 "목록에 없음")
  if (
    isApiError(body) ||
    (api === 'libSrch' && !parseLibraries(body, '').length)
  ) {
    console.error(`[data4library] ${api} 오류 응답`);
    throw new ApiError(api);
  }
  return { body, date: res.headers.get('date') };
}

/** 1. 도서관 목록 (libSrch): 시·도별. 7일 캐시. */
export async function findLibraries({
  region,
}: {
  region: string;
}): Promise<Library[]> {
  if (isMock) return mock.libraries.filter((l) => l.region === region);
  // 확인됨 (10/28): pageSize 2000 이면 경기도 400곳을 한 번에 다 준다
  const { body } = await call(
    'libSrch',
    { region, pageNo: '1', pageSize: '2000' },
    7 * DAY,
  );
  return parseLibraries(body, region);
}

// 한도 보호: 코드(사용자 입력)로 직접 묻지 않고 시·도 목록(7일 캐시)에서 찾는다 → 어떤 코드를 넣어도 7일에 많아야 17건.
// 한 시·도가 실패해도 나머지에서 찾는다. cache: 책 화면의 generateMetadata 와 본문이 한 번만 부르게.
export const getLibrary = cache(
  async (libCode: string): Promise<Library | null> => {
    const lists = await Promise.allSettled(
      SIDO.map((s) => findLibraries({ region: s.code })),
    );
    return (
      lists
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .find((l) => l.code === libCode) ?? null
    );
  },
);

/** 2. 책 검색: 제목·저자 낱말 또는 ISBN. 1일 캐시. */
export async function searchBooks(query: string): Promise<Book[]> {
  const isbn = parseIsbn(query);
  if (isMock) {
    const norm = (s: string) => s.replace(/\s/g, '').toLowerCase();
    return mock.books.filter((b) =>
      isbn
        ? b.isbn13 === isbn
        : norm(`${b.title}${b.authors}`).includes(norm(query)),
    );
  }
  if (isbn)
    return parseBooks((await call('srchBooks', { isbn13: isbn }, DAY)).body);
  // 확인됨 (10/28): keyword 로 "소년이 온다" 를 찾으면 그 책이 안 나온다. title 은 찾지만 저자("한강")는 못 찾는다 → 둘 다 묻고 합친다
  const page = { pageNo: '1', pageSize: '20' };
  const [byTitle, byKeyword] = await Promise.all([
    call('srchBooks', { title: query, ...page }, DAY),
    call('srchBooks', { keyword: query, ...page }, DAY),
  ]);
  return parseBooks(byTitle.body, byKeyword.body).slice(0, 20);
}

// cache: 책 화면의 generateMetadata 와 본문이 같은 요청에서 부른다. fetch 에 signal 이 있어 Next 의 중복 제거가 안 된다
export const getBook = cache(async (isbn13: string): Promise<Book | null> => {
  return (await searchBooks(isbn13)).find((b) => b.isbn13 === isbn13) ?? null;
});

/** 인기 대출 도서 (loanItemSrch): 사이트맵용. 1일 캐시라 하루 1건. */
export async function popularBooks(count: number): Promise<Book[]> {
  if (isMock) return mock.books.slice(0, count);
  // 기간 없이 물으면 8초 안에 답이 안 온다 (10/28 빌드) → 최근 30일
  const day = (n: number) =>
    new Date(Date.now() - n * DAY * 1000).toISOString().slice(0, 10);
  const params = {
    startDt: day(31),
    endDt: day(1),
    pageNo: '1',
    pageSize: String(count),
  };
  return parseBooks((await call('loanItemSrch', params, DAY)).body);
}

/** 문장 찾기 후보 (srchBooks 낱말 → 0권이면 loanItemSrch 연령·주제). 1일 캐시. 인자는 LLM 이 만든 조건뿐 (문장 없음). */
export async function findCandidates(
  c: Conditions,
): Promise<{ found: Found[]; calls: number }> {
  if (isMock) {
    // 가짜 데이터는 몇 권뿐이라 낱말 중 하나라도 제목·저자에 들어 있으면 낸다 (진짜는 그리고)
    const found = mock.books
      .filter((b) =>
        c.keywords.some((k) => `${b.title}${b.authors}`.includes(k)),
      )
      .map((b, i) => ({
        ...b,
        classNm: '문학 > 한국문학 > 소설',
        addCode: '03810',
        classNo: '813.7',
        loans: 100 - i,
      }));
    return { found, calls: 0 };
  }
  return searchCandidates(
    async (api, params) => (await call(api, params, DAY)).body,
    c,
    Date.now(),
  );
}

/** 3. 도서관 한 곳의 소장·대출 (bookExist). 대출 가능은 전일 기준. 1일 캐시. */
export async function bookExist(
  libCode: string,
  isbn13: string,
): Promise<Availability> {
  if (isMock) {
    if (libCode === mock.BROKEN_LIB) throw new ApiError('bookExist');
    const loan = mock.holdings[libCode]?.[isbn13];
    return {
      hasBook: loan !== undefined,
      loanAvailable: loan === true,
      checkedAt: new Date().toISOString(),
    };
  }
  // 확인됨 (10/28): result.hasBook·loanAvailable 이 "Y"/"N". 전일 기준은 매뉴얼 설명
  const { body, date } = await call('bookExist', { libCode, isbn13 }, DAY);
  const r = parseBookExist(body);
  if (!r) throw new ApiError('bookExist');
  // 캐시된 응답이면 응답 헤더의 Date 가 처음 받은 시각이다 → "어제"를 그 날짜로 계산
  const t = Date.parse(date ?? '');
  return {
    ...r,
    checkedAt: new Date(Number.isNaN(t) ? Date.now() : t).toISOString(),
  };
}

/** 4. 이 책을 가진 지역 도서관 (libSrchByBook). 1일 캐시. */
export async function librariesWithBook(
  isbn13: string,
  region: string,
): Promise<Library[]> {
  if (isMock) {
    return mock.libraries.filter(
      (l) =>
        l.region === region && mock.holdings[l.code]?.[isbn13] !== undefined,
    );
  }
  // 확인됨 (10/28): 파라미터는 isbn. 「소년이 온다」는 서울에서만 321곳이라 200 이면 잘린다 → 2000 (한 번에 다 준다)
  const { body } = await call(
    'libSrchByBook',
    { isbn: isbn13, region, pageNo: '1', pageSize: '2000' },
    DAY,
  );
  return parseLibraries(body, region);
}
