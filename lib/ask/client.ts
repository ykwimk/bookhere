// 화면 (components/AskForm.tsx) 쪽 일. 브라우저 값 (history·fetch) 은 인자로 받아 Node 시험에서 가짜로 바꾼다
import { safeUrl } from '../parse.ts';
import type { AskBook, AskResponse } from './types.ts';

export type Shown = {
  outcome: AskResponse['outcome'];
  books: AskBook[];
  keywords: string[];
};
type Hist = Pick<History, 'state' | 'replaceState'>;

const s = (v: unknown) => (typeof v === 'string' ? v : '');

/** 서버 응답·기록 칸 값은 밖에서 온 값으로 본다. */
export function readShown(v: unknown): Shown | null {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  if (
    !['ai', 'fallback', 'empty', 'capped', 'busy', 'error'].includes(
      s(o.outcome),
    )
  )
    return null;
  const books = (Array.isArray(o.books) ? o.books : [])
    .filter((b) => /^\d{13}$/.test(s(b?.isbn13)) && s(b.title))
    .map((b) => ({
      isbn13: s(b.isbn13),
      title: s(b.title),
      authors: s(b.authors),
      publisher: s(b.publisher),
      year: s(b.year),
      cover: safeUrl(b.cover),
      reason: s(b.reason) || undefined,
    }));
  const keywords = (Array.isArray(o.keywords) ? o.keywords : [])
    .map(s)
    .filter(Boolean);
  return { outcome: o.outcome as Shown['outcome'], books, keywords };
}

// 지난 결과 (책·이유만, 문장은 빼고) 는 지금 기록 칸 (history.state) 에 둔다. 뒤로·앞으로로 이 칸에 돌아올 때만 다시 보이고
// (같은 문장으로 LLM 을 또 부르지 않게), 링크로 새로 들어오면 새 칸이라 없다
const KEY = 'bookhereAsk';

export function loadLast(h: Hist): Shown | null {
  const last = readShown(h.state?.[KEY]);
  return last?.books.length ? last : null;
}

export function saveLast(h: Hist, shown: Shown | null) {
  try {
    h.replaceState(
      { ...h.state, [KEY]: shown?.books.length ? shown : null },
      '',
    );
  } catch {} // 사파리는 짧은 새 너무 자주 부르면 던진다. 못 남겨도 화면은 그대로
}

/** 찾기. 지난 결과를 먼저 지운다 (새 찾기가 실패해도 옛 결과가 다시 뜨지 않게). 망이 끊겨 답이 안 오면 ms 뒤 끊고 null (오류 화면). */
export async function ask(
  sentence: string,
  h: Hist,
  f: typeof fetch = fetch,
  ms = 15_000,
): Promise<Shown | null> {
  saveLast(h, null);
  const ctrl = new AbortController(); // AbortSignal.timeout 은 옛 사파리 (16 미만) 에 없다
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await f('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
      signal: ctrl.signal,
    });
    const shown = res.ok ? readShown(await res.json()) : null;
    if (shown) saveLast(h, shown);
    return shown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 문장 칸: Enter = 찾기, Shift+Enter = 줄바꿈. 한글을 조합하는 중의 Enter (isComposing, keyCode 229) 는 글자 확정이라, 눌러 둔 반복 Enter 는 중복이라 찾지 않는다 */
export const submitsOnEnter = (e: {
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  keyCode: number;
  repeat: boolean;
}) =>
  e.key === 'Enter' &&
  !e.shiftKey &&
  !e.isComposing &&
  e.keyCode !== 229 &&
  !e.repeat; // 누르고 있으면 답이 올 때마다 같은 문장을 또 보내 하루 상한을 태운다
