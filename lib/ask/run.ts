// 문장 찾기 파이프라인: 하루 상한 → ① 조건 → 조건 검사 → 후보 찾기 → ② 고르기 → 고른 책 검사 → 응답 → 기록.
// 입력 정리 (cleanSentence) 는 부르는 쪽이 먼저 한다 (실패면 400, 기록 없음).
// 바깥 일 (LLM·정보나루·상한 세기·기록·시각) 은 인자로 받는다: 라우트는 진짜, 시험은 가짜, eval 은 진짜 LLM + 스냅샷.
// 콘솔에는 단계·실패 종류만. 문장·이유·오류 객체는 찍지 않는다.
import { checkConditions, checkPicks, toCandidate } from './guard.ts';
import { narrow } from './find.ts';
import { toBook } from '../parse.ts';
import type {
  AskResponse,
  Conditions,
  Found,
  Llm,
  LlmResult,
  LogRow,
} from './types.ts';

export const DEADLINE_MS = 8000; // 요청 시작부터. ① 중에 넘으면 오류, ② 중에 넘으면 폴백
const FALLBACK_BOOKS = 10;

export type Deps = {
  llm: Llm;
  find: (c: Conditions) => Promise<{ found: Found[]; calls: number }>;
  takeSlot: () => Promise<boolean>; // 하루 상한 안이면 true 를 주고 하나 센다
  log: (row: LogRow) => void; // 응답을 막지 않게 (라우트는 after())
  now: () => number;
  deadlineMs?: number;
};

/** 마감이 먼저 오면 signal.reason 으로 거절. 늦게 끝난 쪽의 결과는 버린다. */
function beforeDeadline<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    if (signal.aborted) return onAbort();
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(resolve, reject).finally(() =>
      signal.removeEventListener('abort', onAbort),
    );
  });
}

/** llm.ts 가 던지거나 마감을 넘겨도 ok:false 로 받는다. */
async function callLlm<T>(
  f: () => Promise<LlmResult<T>>,
  signal: AbortSignal,
): Promise<LlmResult<T>> {
  try {
    return await beforeDeadline(f(), signal);
  } catch {
    return {
      ok: false,
      fail: signal.aborted ? 'timeout' : 'other',
      usage: null,
    };
  }
}

export async function runAsk(
  input: { sentence: string; masked: number },
  d: Deps,
): Promise<AskResponse> {
  const t0 = d.now();
  const signal = AbortSignal.timeout(d.deadlineMs ?? DEADLINE_MS);
  const fake = d.llm.PROMPT_VERSION === 'fake';
  const row: LogRow = {
    at: new Date(Math.floor(t0 / 60000) * 60000).toISOString(), // 분 단위: Vercel 요청 기록과 초 단위로 묶이지 않게
    prompt_version: d.llm.PROMPT_VERSION,
    model: d.llm.MODEL,
    outcome: 'error',
    fail_step: null,
    fail_kind: null,
    status: null,
    llm1_in: null,
    llm1_out: null,
    llm1_ms: null,
    llm2_in: null,
    llm2_out: null,
    llm2_ms: null,
    d4l_ms: null,
    d4l_calls: 0,
    total_ms: 0,
    cost_usd: 0,
    input_len: input.sentence.length,
    masked: input.masked,
    candidates: 0,
    filtered: 0,
    guard_dropped: 0,
    reasons_cut: 0,
    conditions: null,
    picks: [],
  };
  type Failure = { fail?: string; status?: number };
  const fail = (step: LogRow['fail_step'], r: Failure) => {
    row.fail_step = step;
    row.fail_kind = r.fail ?? null;
    row.status = r.status ?? null;
  };
  const done = (res: AskResponse): AskResponse => {
    row.outcome = res.outcome;
    row.total_ms = d.now() - t0;
    const p = d.llm.PRICE_PER_MTOK;
    const cost =
      ((row.llm1_in ?? 0) + (row.llm2_in ?? 0)) * p.input +
      ((row.llm1_out ?? 0) + (row.llm2_out ?? 0)) * p.output;
    row.cost_usd = Math.round(cost) / 1e6; // 100만 토큰당 $ → $, 소수 6자리
    try {
      d.log(row);
    } catch {
      console.error('[ask] 기록 실패');
    }
    return res;
  };
  const error = (step: LogRow['fail_step'], r: Failure): AskResponse => {
    fail(step, r);
    return done({ outcome: 'error', books: [], fake });
  };

  try {
    if (!(await d.takeSlot()))
      return done({ outcome: 'capped', books: [], fake });

    // ① 문장 → 조건
    const r1 = await callLlm(
      () => d.llm.toConditions(input.sentence, signal),
      signal,
    );
    if (r1.usage)
      [row.llm1_in, row.llm1_out, row.llm1_ms] = [
        r1.usage.inputTokens,
        r1.usage.outputTokens,
        r1.usage.ms,
      ];
    if (!r1.ok) return error('llm1', r1);
    const cond = checkConditions(r1.value);
    if (!cond) return error('llm1', { fail: 'parse' });
    row.conditions = cond;

    // 후보 찾기 (정보나루). 마감을 넘기면 받은 후보가 없으므로 오류
    const t1 = d.now();
    let found: Found[];
    try {
      const r = await beforeDeadline(d.find(cond), signal);
      found = r.found;
      row.d4l_calls = r.calls;
    } catch {
      return error('d4l', { fail: signal.aborted ? 'timeout' : 'error' });
    } finally {
      row.d4l_ms = d.now() - t1;
    }
    row.candidates = found.length;
    if (!found.length) return done({ outcome: 'empty', books: [], fake });
    const { list, removed } = narrow(found, cond);
    row.filtered = removed;

    // 폴백: 이미 받은 후보를 대출 많은 순으로 (정보나루를 다시 부르지 않는다). 이유·AI 표시 없음
    const fallback = (step: LogRow['fail_step'], r: Failure): AskResponse => {
      fail(step, r);
      const books = [...list]
        .sort((a, b) => b.loans - a.loans)
        .slice(0, FALLBACK_BOOKS)
        .map(toBook);
      return done({
        outcome: 'fallback',
        books,
        keywords: cond.keywords,
        fake,
      });
    };

    // ② 후보 안에서 고르기
    const candidates = list.map(toCandidate);
    const r2 = await callLlm(
      () => d.llm.pickBooks(input.sentence, candidates, signal),
      signal,
    );
    if (r2.usage)
      [row.llm2_in, row.llm2_out, row.llm2_ms] = [
        r2.usage.inputTokens,
        r2.usage.outputTokens,
        r2.usage.ms,
      ];
    if (!r2.ok) return fallback('llm2', r2);
    const g = checkPicks(r2.value, candidates);
    row.guard_dropped = g.dropped;
    row.reasons_cut = g.cut;
    row.picks = g.picks.map((p) => p.isbn13);
    if (!g.picks.length) return fallback('guard', { fail: 'no_picks' });

    const byIsbn = new Map(list.map((f) => [f.isbn13, f]));
    const books = g.picks.map((p) => ({
      ...toBook(byIsbn.get(p.isbn13)!),
      reason: p.reason,
    }));
    return done({ outcome: 'ai', books, fake });
  } catch (e) {
    console.error(
      `[ask] 예기치 않은 실패 (${e instanceof Error ? e.name : 'unknown'})`,
    );
    return error(row.fail_step, { fail: 'other' });
  }
}
