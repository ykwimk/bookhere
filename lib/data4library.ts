// 도서관 정보나루 Open API. 서버 전용: 라우트 핸들러와 서버 컴포넌트에서만 import 한다.
// 인증키(DATA4LIBRARY_KEY)는 서버 환경변수에서만 읽는다. 없으면 lib/mock 의 가짜 데이터를 돌려준다.
// API 이름·파라미터·응답 모양은 10/28 인증키로 실제 응답을 받아 확인했다.
import { unstable_cache } from "next/cache";
import type { Availability, Book, Library } from "./types";
import { isApiError, parseBookExist, parseBooks, parseLibraries } from "./parse";
import { parseIsbn } from "./validate";
import { sidoOf } from "./regions";
import * as mock from "./mock/data";

const BASE = "https://data4library.kr/api"; // 확인됨 (10/27 https 200). 키가 쿼리에 들어가므로 http는 쓰지 않는다
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
  const url = `${BASE}/${api}?${new URLSearchParams({ ...params, authKey: KEY ?? "", format: "json" })}`;
  // 오류·로그에 url 이나 오류 객체를 통째로 넣지 않는다: url 에 인증키가 있다
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
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
  // 확인됨 (10/28): region·libCode 파라미터 둘 다 된다. pageSize 2000 이면 경기도 400곳을 한 번에 다 준다
  const { body } = await call("libSrch", { ...by, pageNo: "1", pageSize: "2000" }, 7 * DAY);
  return parseLibraries(body, "region" in by ? by.region : "");
}

export async function getLibrary(libCode: string): Promise<Library | null> {
  const lib = (await findLibraries({ libCode }))[0];
  // 코드로 찾으면 시·도를 모른다 → 주소에서 뽑는다 (/api/availability 가 시·도 목록과 대조할 때 씀)
  return lib ? { ...lib, region: lib.region || sidoOf(lib.address) } : null;
}

/** 2. 책 검색: 제목·저자 낱말 또는 ISBN. 1일 캐시. */
export async function searchBooks(query: string): Promise<Book[]> {
  const isbn = parseIsbn(query);
  if (isMock) {
    const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();
    return mock.books.filter((b) => (isbn ? b.isbn13 === isbn : norm(`${b.title}${b.authors}`).includes(norm(query))));
  }
  if (isbn) return parseBooks((await call("srchBooks", { isbn13: isbn }, DAY)).body);
  // 확인됨 (10/28): keyword 로 "소년이 온다" 를 찾으면 그 책이 안 나온다. title 은 찾지만 저자("한강")는 못 찾는다 → 둘 다 묻고 합친다
  const page = { pageNo: "1", pageSize: "20" };
  const [byTitle, byKeyword] = await Promise.all([
    call("srchBooks", { title: query, ...page }, DAY),
    call("srchBooks", { keyword: query, ...page }, DAY),
  ]);
  return parseBooks(byTitle.body, byKeyword.body).slice(0, 20);
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
  // 확인됨 (10/28): result.hasBook·loanAvailable 이 "Y"/"N". 전일 기준은 매뉴얼 설명
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
  // 확인됨 (10/28): 파라미터는 isbn. 「소년이 온다」는 서울에서만 321곳이라 200 이면 잘린다 → 2000 (한 번에 다 준다)
  const { body } = await call("libSrchByBook", { isbn: isbn13, region, pageNo: "1", pageSize: "2000" }, DAY);
  return parseLibraries(body, region);
}
