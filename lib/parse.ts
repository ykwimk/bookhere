// 정보나루 JSON 응답을 화면용 모양으로 바꾼다.
// 응답 모양은 추정이다 (제3자 코드 data4library-mcp + 기억). 인증키를 받은 뒤 실제 응답으로 확인한다.
import type { Book, Library } from "./types";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const str = (v: unknown): string =>
  typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";

// 목록 항목이 { lib: {...} } / { doc: {...} } 로 한 번 더 감싸져 온다고 추정. 감싸지 않은 모양도 받는다.
function list(body: unknown, key: "libs" | "docs", inner: "lib" | "doc"): Obj[] {
  const arr = obj(obj(body).response)[key];
  return Array.isArray(arr) ? arr.map((x) => obj(obj(x)[inner] ?? x)) : [];
}

/** 링크·이미지로 쓸 주소. http(s)만 남기고 "www.x.kr" 처럼 스킴이 없으면 http를 붙인다. javascript: 등은 버린다. */
export function safeUrl(v: unknown): string {
  const s = str(v);
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(s)) return `http://${s}`;
  return "";
}

/** 정보나루가 오류를 본문으로 줄 때: { response: { error: "..." } } (추정) */
export const isApiError = (body: unknown) => !obj(body).response || "error" in obj(obj(body).response);

export function parseLibraries(body: unknown, region = ""): Library[] {
  return list(body, "libs", "lib")
    .map((l) => ({
      code: str(l.libCode),
      name: str(l.libName),
      address: str(l.address),
      homepage: safeUrl(l.homepage),
      region,
    }))
    .filter((l) => l.code && l.name);
}

export function parseBooks(body: unknown): Book[] {
  return list(body, "docs", "doc")
    .map((d) => ({
      isbn13: str(d.isbn13),
      title: str(d.bookname),
      authors: str(d.authors),
      publisher: str(d.publisher),
      year: str(d.publication_year),
      cover: safeUrl(d.bookImageURL),
    }))
    .filter((b) => /^\d{13}$/.test(b.isbn13) && b.title);
}

// "Y"/"N" 문자열(매뉴얼 추정)과 true/false(제3자 코드) 둘 다 받는다.
const yes = (v: unknown) => v === true || v === "Y" || v === "y" || v === "true";

/** bookExist → result.hasBook, result.loanAvailable. 필드가 없으면 null (= 확인 못 함). */
export function parseBookExist(body: unknown): { hasBook: boolean; loanAvailable: boolean } | null {
  const r = obj(obj(obj(body).response).result);
  if (!("hasBook" in r)) return null;
  const hasBook = yes(r.hasBook);
  return { hasBook, loanAvailable: hasBook && yes(r.loanAvailable) };
}
