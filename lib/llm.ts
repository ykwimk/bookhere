// 대표 파일 자리. 지금은 builder 가 만든 가짜: LLM 을 부르지 않고 문장 속 낱말 규칙으로 답한다 (화면 상태 캡처·시험용).
// 대표가 이 파일을 통째로 바꾼다. 지킬 것 (기획서 "나눠 쓰는 경계"):
// - 이 다섯 개만 내보낸다: PROMPT_VERSION, MODEL, PRICE_PER_MTOK, toConditions, pickBooks
// - 콘솔 출력 금지 (문장·출력이 로그에 남는다. test/ask.test.ts 가 파일 글자로 검사)
// - next/* 나 다른 lib 의 값은 import 하지 않는다. `import type` 만 (eval/run.ts 가 Node 로 바로 부른다)
// - 패키지 없이 fetch. 키는 서버 환경변수 (.env.local)
// - 실패는 던지지 않고 ok:false 로. 응답을 받았으면 실패여도 usage 를 채운다
// - 값 검사 (허용 코드·후보 안 ISBN·이유 60자·5권) 는 lib/ask/guard.ts 가 한다
import type { Candidate, Conditions, LlmResult, Pick } from "./ask/types.ts";

export const PROMPT_VERSION = "fake";
export const MODEL = "fake";
export const PRICE_PER_MTOK = { input: 0, output: 0 };

// 가짜 규칙: "느림" → 마감까지 기다림 / "실패1" → ① http / "실패2" → ② parse / "밖" → 후보에 없는 ISBN 하나 섞음
const waitForAbort = (signal: AbortSignal) =>
  new Promise<void>((resolve) => (signal.aborted ? resolve() : signal.addEventListener("abort", () => resolve(), { once: true })));

const usage = (start: number, inputTokens: number) => ({ inputTokens, outputTokens: 20, ms: Date.now() - start });

export async function toConditions(sentence: string, signal: AbortSignal): Promise<LlmResult<Conditions>> {
  const start = Date.now();
  if (sentence.includes("느림")) {
    await waitForAbort(signal);
    return { ok: false, fail: "timeout", usage: null };
  }
  if (sentence.includes("실패1")) return { ok: false, fail: "http", status: 500, usage: null };
  const keywords = sentence.split(" ").filter((w) => w.length >= 2).slice(0, 2);
  return { ok: true, value: { keywords, age: null, kdc: null, addCode: null }, usage: usage(start, sentence.length) };
}

export async function pickBooks(sentence: string, candidates: Candidate[], signal: AbortSignal): Promise<LlmResult<Pick[]>> {
  const start = Date.now();
  if (sentence.includes("느림")) {
    await waitForAbort(signal);
    return { ok: false, fail: "timeout", usage: null };
  }
  if (sentence.includes("실패2")) return { ok: false, fail: "parse", usage: usage(start, candidates.length * 30) };
  const picks = candidates.slice(0, 5).map((c) => ({ isbn13: c.isbn13, reason: "가짜 이유" }));
  if (sentence.includes("밖")) picks.unshift({ isbn13: "9790000000000", reason: "가짜 이유" });
  return { ok: true, value: picks, usage: usage(start, candidates.length * 30) };
}
