// 문장으로 책 찾기 (/ask). 대표 파일 lib/llm.ts 와 팀 코드 사이의 경계 (기획서 2026-11-09 "나눠 쓰는 경계").
// 이 파일과 lib/ask/*.ts 는 eval/run.ts 가 Node 로 바로 부른다: next/* 를 import 하지 않고, 서로는 .ts 확장자를 붙여 import 한다.

export type Conditions = {
  keywords: string[];
  age: string | null;
  kdc: string | null;
  addCode: string | null;
};
export type Candidate = {
  isbn13: string;
  title: string;
  authors: string;
  publisher: string;
  year: string;
  classNm: string;
  addCode: string;
};
export type Pick = { isbn13: string; reason: string };
export type Usage = { inputTokens: number; outputTokens: number; ms: number };
export type LlmResult<T> =
  | { ok: true; value: T; usage: Usage }
  | {
      ok: false;
      fail: 'timeout' | 'http' | 'parse' | 'refused' | 'other';
      status?: number;
      usage: Usage | null;
    };

/** lib/llm.ts 가 내보내는 다섯 개. 파이프라인은 이 모양만 안다 (라우트·eval 은 진짜, 시험은 가짜를 넣는다). */
export type Llm = {
  PROMPT_VERSION: string;
  MODEL: string;
  PRICE_PER_MTOK: { input: number; output: number };
  toConditions(
    sentence: string,
    signal: AbortSignal,
  ): Promise<LlmResult<Conditions>>;
  pickBooks(
    sentence: string,
    candidates: Candidate[],
    signal: AbortSignal,
  ): Promise<LlmResult<Pick[]>>;
};

/** 정보나루에서 받은 후보 한 권. LLM 에는 toCandidate() 로 Candidate 7칸만 보낸다 (표지·대출 수·classNo 는 안 보냄). */
export type Found = Candidate & {
  classNo: string;
  cover: string;
  loans: number;
};

export type Outcome = 'ai' | 'fallback' | 'empty' | 'capped' | 'error';
export type AskBook = {
  isbn13: string;
  title: string;
  authors: string;
  publisher: string;
  year: string;
  cover: string;
  reason?: string;
};
export type AskResponse = {
  outcome: Outcome;
  books: AskBook[];
  keywords?: string[];
  fake: boolean;
};

/** 요청마다 한 행 (Supabase ask_log). 문장 원문·이유 글·제목·IP 는 넣지 않는다 (verifier 3a). */
export type LogRow = {
  at: string; // 분 단위로 자른 시각 (ISO)
  prompt_version: string;
  model: string;
  outcome: Outcome;
  fail_step: 'llm1' | 'd4l' | 'llm2' | 'guard' | null;
  fail_kind: string | null; // LLM 실패 종류, 정보나루 "timeout"(마감)·"error", 가드레일 "no_picks"
  status: number | null;
  llm1_in: number | null;
  llm1_out: number | null;
  llm1_ms: number | null;
  llm2_in: number | null;
  llm2_out: number | null;
  llm2_ms: number | null;
  d4l_ms: number | null;
  d4l_calls: number; // findCandidates 가 부른 수 (하루 캐시에 맞아도 센다)
  total_ms: number;
  cost_usd: number;
  input_len: number; // 지운 뒤 문장 글자 수
  masked: number; // 지운 개인정보 꼴 수
  candidates: number; // 정보나루가 준 후보 수
  filtered: number; // 부가기호·KDC 로 걸러 낸 수 (거르지 않았으면 0)
  guard_dropped: number; // 후보 밖 ISBN 이라 버린 수
  reasons_cut: number; // 60자 넘어 자른 이유 수
  conditions: Conditions | null;
  picks: string[]; // 고른 ISBN (최대 5)
};
