// 시험용 가짜 LLM (lib/llm.ts 와 같은 모양). LLM 을 부르지 않고 문장 속 낱말 규칙으로 답한다.
// 원래 lib/llm.ts 자리에 있던 것을 대표가 진짜를 쓰면서 시험 쪽으로 옮겼다 (시험이 네트워크를 부르지 않게).
import type {
  Candidate,
  Conditions,
  LlmResult,
  Pick,
} from '../lib/ask/types.ts';

export const PROMPT_VERSION = 'fake';
export const MODEL = 'fake';
export const PRICE_PER_MTOK = { input: 0, output: 0 };

// 가짜 규칙: "느림" → 마감까지 기다림 / "실패1" → ① http / "실패2" → ② parse / "밖" → 후보에 없는 ISBN 하나 섞음
const waitForAbort = (signal: AbortSignal) =>
  new Promise<void>((resolve) =>
    signal.aborted
      ? resolve()
      : signal.addEventListener('abort', () => resolve(), { once: true }),
  );

const usage = (start: number, inputTokens: number) => ({
  inputTokens,
  outputTokens: 20,
  ms: Date.now() - start,
});

export async function toConditions(
  sentence: string,
  signal: AbortSignal,
): Promise<LlmResult<Conditions>> {
  const start = Date.now();
  if (sentence.includes('느림')) {
    await waitForAbort(signal);
    return { ok: false, fail: 'timeout', usage: null };
  }
  if (sentence.includes('실패1'))
    return { ok: false, fail: 'http', status: 500, usage: null };
  const keywords = sentence
    .split(' ')
    .filter((w) => w.length >= 2)
    .slice(0, 2);
  return {
    ok: true,
    value: { keywords, age: null, kdc: null, addCode: null },
    usage: usage(start, sentence.length),
  };
}

export async function pickBooks(
  sentence: string,
  candidates: Candidate[],
  signal: AbortSignal,
): Promise<LlmResult<Pick[]>> {
  const start = Date.now();
  if (sentence.includes('느림')) {
    await waitForAbort(signal);
    return { ok: false, fail: 'timeout', usage: null };
  }
  if (sentence.includes('실패2'))
    return {
      ok: false,
      fail: 'parse',
      usage: usage(start, candidates.length * 30),
    };
  const picks = candidates
    .slice(0, 5)
    .map((c) => ({ isbn13: c.isbn13, reason: '가짜 이유' }));
  if (sentence.includes('밖'))
    picks.unshift({ isbn13: '9790000000000', reason: '가짜 이유' });
  return {
    ok: true,
    value: picks,
    usage: usage(start, candidates.length * 30),
  };
}
