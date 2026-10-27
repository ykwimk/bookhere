// 도서관 정보나루 Open API. 서버 전용: 라우트 핸들러와 서버 컴포넌트에서만 import 한다.
// 인증키(DATA4LIBRARY_KEY)는 서버 환경변수에서만 읽는다. 없으면 lib/mock 의 가짜 데이터를 돌려준다.
// API 이름·파라미터·응답 모양은 추정이다. "TODO(API 확인)" 표시를 인증키를 받은 뒤 매뉴얼로 확인한다.
import type { Availability, Book, Library } from "./types";
import { isApiError, parseBookExist, parseBooks, parseLibraries } from "./parse";
import { parseIsbn } from "./validate";
import * as mock from "./mock/data";

const BASE = "https://data4library.kr/api"; // TODO(API 확인): https 지원 여부 (키가 쿼리에 들어가므로 http는 피한다)
const DAY = 60 * 60 * 24;
const KEY = process.env.DATA4LIBRARY_KEY;

export const isMock = !KEY;

export class ApiError extends Error {}

// shortcut: fetch revalidate 는 정보나루가 오류를 HTTP 200 본문으로 줄 때 그 응답도 캐시할 수 있다
// (한도 초과가 하루 동안 남음). 실제 오류 형식을 본 뒤 그렇다면 파싱 결과만 캐시하는 방식으로 바꾼다.
async function call(api: string, params: Record<string, string>, revalidate: number) {
  const url = `${BASE}/${api}?${new URLSearchParams({ ...params, authKey: KEY ?? "", format: "json" })}`;
  // 오류·로그에 url 이나 오류 객체를 통째로 넣지 않는다: url 에 인증키가 있다
  let res: Response;
  try {
    res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(8000) });
  } catch (e) {
    console.error(`[data4library] ${api} 연결 실패 (${e instanceof Error ? e.name : "unknown"})`);
    throw new ApiError(api);
  }
  if (!res.ok) {
    console.error(`[data4library] ${api} HTTP ${res.status}`);
    throw new ApiError(api);
  }
  const body: unknown = await res.json().catch(() => null);
  if (isApiError(body)) {
    console.error(`[data4library] ${api} 오류 응답`);
    throw new ApiError(api);
  }
  return { body, date: res.headers.get("date") };
}

/** 1. 도서관 목록 (libSrch): 시·도별, 또는 도서관 코드 하나. 7일 캐시. */
export async function findLibraries(by: { region: string } | { libCode: string }): Promise<Library[]> {
  if (isMock) {
    return mock.libraries.filter((l) => ("region" in by ? l.region === by.region : l.code === by.libCode));
  }
  // TODO(API 확인): libSrch 의 region·libCode 파라미터, pageSize 최대치 (경기도는 수백 곳)
  const { body } = await call("libSrch", { ...by, pageNo: "1", pageSize: "2000" }, 7 * DAY);
  return parseLibraries(body, "region" in by ? by.region : "");
}

export async function getLibrary(libCode: string): Promise<Library | null> {
  return (await findLibraries({ libCode }))[0] ?? null;
}

/** 2. 책 검색: 제목·저자 낱말 또는 ISBN. 1일 캐시. */
export async function searchBooks(query: string): Promise<Book[]> {
  const isbn = parseIsbn(query);
  if (isMock) {
    const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();
    return mock.books.filter((b) => (isbn ? b.isbn13 === isbn : norm(`${b.title}${b.authors}`).includes(norm(query))));
  }
  // TODO(API 확인): 책 검색 API 이름 "srchBooks" 와 파라미터(keyword, isbn13, pageSize)는 팀장 추정. 매뉴얼로 확인
  const { body } = await call("srchBooks", isbn ? { isbn13: isbn } : { keyword: query, pageNo: "1", pageSize: "20" }, DAY);
  return parseBooks(body);
}

export async function getBook(isbn13: string): Promise<Book | null> {
  return (await searchBooks(isbn13)).find((b) => b.isbn13 === isbn13) ?? null;
}

/** 3. 도서관 한 곳의 소장·대출 (bookExist). 대출 가능은 전일 기준. 1일 캐시. */
export async function bookExist(libCode: string, isbn13: string): Promise<Availability> {
  if (isMock) {
    if (libCode === mock.BROKEN_LIB) throw new ApiError("bookExist");
    const loan = mock.holdings[libCode]?.[isbn13];
    return { hasBook: loan !== undefined, loanAvailable: loan === true, checkedAt: new Date().toISOString() };
  }
  // TODO(API 확인): 응답에 loanAvailable 이 정말 있는지, 값이 Y/N 인지, 기준이 전일인지
  const { body, date } = await call("bookExist", { libCode, isbn13 }, DAY);
  const r = parseBookExist(body);
  if (!r) throw new ApiError("bookExist");
  // 캐시된 응답이면 응답 헤더의 Date 가 처음 받은 시각이다 → "어제"를 그 날짜로 계산
  const t = Date.parse(date ?? "");
  return { ...r, checkedAt: new Date(Number.isNaN(t) ? Date.now() : t).toISOString() };
}

/** 4. 이 책을 가진 지역 도서관 (libSrchByBook). 1일 캐시. */
export async function librariesWithBook(isbn13: string, region: string): Promise<Library[]> {
  if (isMock) {
    return mock.libraries.filter((l) => l.region === region && mock.holdings[l.code]?.[isbn13] !== undefined);
  }
  // TODO(API 확인): 파라미터 이름(isbn 또는 isbn13), pageSize 최대치
  const { body } = await call("libSrchByBook", { isbn: isbn13, region, pageNo: "1", pageSize: "200" }, DAY);
  return parseLibraries(body, region);
}
