// 문장 찾기 (/ask). 진짜 LLM·정보나루는 부르지 않는다. 실행: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkConditions, checkPicks, cleanSentence, toCandidate } from "../lib/ask/guard.ts";
import { narrow, searchCandidates } from "../lib/ask/find.ts";
import { DAILY_CAP, kstDay, takeSlot, writeLog } from "../lib/ask/log.ts";
import { runAsk, type Deps } from "../lib/ask/run.ts";
import type { Found, Llm, LogRow } from "../lib/ask/types.ts";
import { parseFound } from "../lib/parse.ts";
import * as fakeLlm from "../lib/llm.ts";
import { ask, loadLast, saveLast, type Shown } from "../lib/ask/client.ts";

const book = (n: number, more: Partial<Found> = {}): Found => ({
  isbn13: `97800000000${String(n).padStart(2, "0")}`,
  title: `책${n} :부제`,
  authors: "지은이: 가나다",
  publisher: "출판사",
  year: "2020",
  classNm: "문학 > 한국문학 > 소설",
  addCode: "77810",
  classNo: "813.7",
  cover: "https://img.example/x.jpg",
  loans: n,
  ...more,
});
const books = (k: number) => Array.from({ length: k }, (_, i) => book(i + 1));

test("입력 정리: 전화·이메일·주민번호 꼴을 지우고 개수만 센다", () => {
  assert.deepEqual(cleanSentence("엄마 010-1234-5678 아이 책"), { sentence: "엄마 [지움] 아이 책", masked: 1 });
  assert.deepEqual(cleanSentence("01012345678로 연락"), { sentence: "[지움]로 연락", masked: 1 });
  assert.deepEqual(cleanSentence("a.b+c@mail.co.kr 공룡"), { sentence: "[지움] 공룡", masked: 1 });
  assert.deepEqual(cleanSentence("900101-1234567 우주"), { sentence: "[지움] 우주", masked: 1 });
  assert.deepEqual(cleanSentence("  초등   2학년\n공룡  "), { sentence: "초등 2학년 공룡", masked: 0 });
  // 책 이야기 속 숫자는 그대로
  assert.deepEqual(cleanSentence("2024년 9788936434120 책"), { sentence: "2024년 9788936434120 책", masked: 0 });
});

test("입력 정리: 200자까지, 빈 값·문자열 아님은 거절", () => {
  assert.equal(cleanSentence("가".repeat(200))?.sentence.length, 200);
  assert.equal(cleanSentence("가".repeat(201)), null);
  for (const bad of ["", "   ", null, 5, { sentence: "x" }]) assert.equal(cleanSentence(bad), null);
});

test("조건 검사: 낱말 규칙, 허용 코드 밖은 null, 다 비면 실패", () => {
  assert.deepEqual(
    checkConditions({ keywords: ["공룡", "공룡", "그림 책", "a;b", "[지움]", "열한글자가넘는낱말이다", 3, "우주", "과학", "넷째"], age: "a8", kdc: "4", addCode: "7" }),
    { keywords: ["공룡", "우주", "과학"], age: "a8", kdc: "4", addCode: "7" },
  );
  assert.deepEqual(checkConditions({ keywords: [], age: "a9", kdc: "81", addCode: "3" }), null);
  assert.deepEqual(checkConditions({ age: "a14" }), { keywords: [], age: "a14", kdc: null, addCode: null });
  assert.equal(checkConditions(null), null);
  assert.equal(checkConditions("공룡"), null);
});

test("LLM 에 보내는 칸은 7개뿐 (표지·대출 수·classNo 없음)", () => {
  assert.deepEqual(Object.keys(toCandidate(book(1))).sort(), ["addCode", "authors", "classNm", "isbn13", "publisher", "title", "year"]);
});

test("고른 책 검사: 후보 밖은 버리고 센다, 같은 ISBN 한 번, 5권까지, 이유 60자", () => {
  const cands = books(8).map(toCandidate);
  const long = "가".repeat(61);
  const r = checkPicks(
    [
      { isbn13: "9790000000000", reason: "밖" },
      { isbn13: cands[0].isbn13, reason: long },
      { isbn13: cands[0].isbn13, reason: "또" },
      { isbn13: 9780000000002 },
      ...cands.slice(1, 7).map((c) => ({ isbn13: c.isbn13, reason: " 좋아요 " })),
    ],
    cands,
  );
  assert.equal(r.dropped, 2);
  assert.equal(r.cut, 1);
  assert.equal(r.picks.length, 5);
  assert.equal(r.picks[0].reason, "가".repeat(60));
  assert.equal(r.picks[1].reason, "좋아요");
  assert.deepEqual(checkPicks("모양이 다름", cands), { picks: [], dropped: 0, cut: 0 });
});

test("후보 거르기: 부가기호 첫 자리·KDC 앞자리, 5권 미만이 되면 거르지 않음", () => {
  const list = [...books(6), book(7, { addCode: "03810" }), book(8, { classNo: "400" })];
  assert.deepEqual(narrow(list, { keywords: [], age: null, kdc: "8", addCode: "7" }).removed, 2);
  assert.equal(narrow(list, { keywords: [], age: null, kdc: "4", addCode: null }).list.length, 8); // 1권만 남으므로 그대로
});

test("후보 찾기: 낱말은 ; 로 묶어 srchBooks, 0권이고 연령·주제가 있으면 loanItemSrch", async () => {
  const asked: string[] = [];
  const get = async (api: string, params: Record<string, string>) => {
    asked.push(`${api} ${params.keyword ?? `${params.age}/${params.kdc}`} ${params.pageSize}`);
    return { response: { docs: [] } };
  };
  const r = await searchCandidates(get, { keywords: ["공룡", "그림책"], age: "a8", kdc: "4", addCode: null }, Date.parse("2026-11-09T00:00:00Z"));
  assert.deepEqual(asked, ["srchBooks 공룡;그림책 50", "loanItemSrch a8/4 50"]);
  assert.equal(r.calls, 2);
});

test("후보 파서: 실제 응답 칸 (11/9 확인 모양)", () => {
  const body = {
    response: {
      docs: [
        { doc: { bookname: "내가 공룡이었을 때 ", authors: "글·그림: 마츠오카 다츠히데", publisher: "웅진", publication_year: "2013", isbn13: "9788997984091", addition_symbol: "77830", class_no: "833.6", class_nm: "문학 > 일본문학 > 소설", bookImageURL: "https://img/1.jpg", loan_count: "30485" } },
        { doc: { bookname: "눈물바다", isbn13: "9788958284055", addition_symbol: "77810", class_no: "813.6", loan_count: "83759" } },
      ],
    },
  };
  const [a, b] = parseFound(body);
  assert.equal(a.isbn13, "9788958284055"); // 대출 많은 순
  assert.deepEqual({ ...b }, {
    isbn13: "9788997984091", title: "내가 공룡이었을 때", authors: "글·그림: 마츠오카 다츠히데", publisher: "웅진", year: "2013",
    classNm: "문학 > 일본문학 > 소설", addCode: "77830", classNo: "833.6", cover: "https://img/1.jpg", loans: 30485,
  });
});

// 파이프라인용 가짜 LLM. 시험마다 고칠 칸만 바꾼다
const llm = (more: Partial<Llm> = {}): Llm => ({
  PROMPT_VERSION: "t1",
  MODEL: "test-model",
  PRICE_PER_MTOK: { input: 0.1, output: 0.5 },
  toConditions: async () => ({ ok: true, value: { keywords: ["공룡"], age: null, kdc: null, addCode: "7" }, usage: { inputTokens: 1000, outputTokens: 100, ms: 5 } }),
  pickBooks: async (_s, cands) => ({
    ok: true,
    value: cands.slice(0, 5).map((c) => ({ isbn13: c.isbn13, reason: "이유표시 공룡이 나와요" })),
    usage: { inputTokens: 2000, outputTokens: 400, ms: 7 },
  }),
  ...more,
});
const deps = (more: Partial<Deps> = {}) => {
  const rows: LogRow[] = [];
  const d: Deps = {
    llm: llm(),
    find: async () => ({ found: books(12), calls: 1 }),
    takeSlot: async () => true,
    log: (row) => rows.push(row),
    now: Date.now,
    ...more,
  };
  return { d, rows };
};
const input = { sentence: "비밀표시 아이랑 읽을 공룡 그림책", masked: 0 };

test("파이프라인: AI 추천 5권 + 이유, 기록 한 행 (비용은 정가로)", async () => {
  const { d, rows } = deps();
  const res = await runAsk(input, d);
  assert.equal(res.outcome, "ai");
  assert.equal(res.books.length, 5);
  assert.equal(res.books[0].title, "책1"); // 화면 제목은 부제를 뗀다
  assert.equal(res.books[0].reason, "이유표시 공룡이 나와요");
  assert.equal(res.fake, false);
  assert.equal(rows.length, 1);
  const r = rows[0];
  assert.equal(r.outcome, "ai");
  assert.equal(r.cost_usd, 0.00055); // ((1000+2000)×0.1 + (100+400)×0.5) / 100만
  assert.deepEqual([r.llm1_in, r.llm2_out, r.d4l_calls, r.candidates, r.picks.length], [1000, 400, 1, 12, 5]);
  assert.match(r.at, /:00\.000Z$/);
});

test("기록 행에 문장·이유·제목·표지가 없다", async () => {
  const { d, rows } = deps();
  await runAsk(input, d);
  const json = JSON.stringify(rows[0]);
  for (const word of ["비밀표시", "아이랑", "이유표시", "책1", "img.example"]) assert.ok(!json.includes(word), word);
});

test("파이프라인: ① 실패 → 오류, ② 실패 → 폴백, 조건 비면 오류", async () => {
  let r = await runAsk(input, deps({ llm: llm({ toConditions: async () => ({ ok: false, fail: "http", status: 529, usage: null }) }) }).d);
  assert.equal(r.outcome, "error");
  const { d, rows } = deps({ llm: llm({ pickBooks: async () => ({ ok: false, fail: "parse", usage: { inputTokens: 1, outputTokens: 1, ms: 1 } }) }) });
  r = await runAsk(input, d);
  assert.equal(r.outcome, "fallback");
  assert.deepEqual(r.keywords, ["공룡"]);
  assert.equal(r.books.length, 10);
  assert.equal(r.books[0].isbn13, book(12).isbn13); // 대출 많은 순
  assert.ok(r.books.every((b) => b.reason === undefined));
  assert.deepEqual([rows[0].fail_step, rows[0].fail_kind], ["llm2", "parse"]);
  const empty = llm({ toConditions: async () => ({ ok: true, value: { keywords: [" "], age: "x", kdc: null, addCode: null }, usage: { inputTokens: 1, outputTokens: 1, ms: 1 } }) });
  assert.equal((await runAsk(input, deps({ llm: empty }).d)).outcome, "error");
});

test("파이프라인: 던져도 ok:false 로 받는다, 정보나루 실패 → 오류, 0권 → 못 찾음", async () => {
  const throwing = llm({ pickBooks: async () => { throw new Error("boom"); } });
  assert.equal((await runAsk(input, deps({ llm: throwing }).d)).outcome, "fallback");
  assert.equal((await runAsk(input, deps({ find: async () => { throw new Error("d4l"); } }).d)).outcome, "error");
  assert.equal((await runAsk(input, deps({ find: async () => ({ found: [], calls: 1 }) }).d)).outcome, "empty");
});

test("파이프라인: 가드레일 — 후보 밖만 고르면 폴백, 섞이면 빼고 센다", async () => {
  const outside = llm({ pickBooks: async () => ({ ok: true, value: [{ isbn13: "9790000000000", reason: "x" }], usage: { inputTokens: 1, outputTokens: 1, ms: 1 } }) });
  const a = deps({ llm: outside });
  assert.equal((await runAsk(input, a.d)).outcome, "fallback");
  assert.deepEqual([a.rows[0].fail_step, a.rows[0].guard_dropped], ["guard", 1]);
});

test("파이프라인: ② 중 마감 → 폴백 (마감 안에 끝난다)", async () => {
  const slow = llm({ pickBooks: (_s, _c, signal) => new Promise((r) => signal.addEventListener("abort", () => r({ ok: false, fail: "timeout", usage: null }))) });
  const t = Date.now();
  const { d, rows } = deps({ llm: slow, deadlineMs: 50 });
  assert.equal((await runAsk(input, d)).outcome, "fallback");
  assert.ok(Date.now() - t < 1000);
  assert.deepEqual([rows[0].fail_step, rows[0].fail_kind], ["llm2", "timeout"]);
  // signal 을 무시하는 llm 이어도 마감에 끊는다
  const deaf = llm({ toConditions: () => new Promise(() => {}) });
  assert.equal((await runAsk(input, deps({ llm: deaf, deadlineMs: 50 }).d)).outcome, "error");
});

test("파이프라인: 하루 상한이면 LLM 을 부르지 않고 capped", async () => {
  let called = false;
  const watch = llm({
    toConditions: async () => {
      called = true;
      return { ok: false, fail: "other", usage: null };
    },
  });
  const { d, rows } = deps({ llm: watch, takeSlot: async () => false });
  assert.equal((await runAsk(input, d)).outcome, "capped");
  assert.equal(called, false);
  assert.equal(rows[0].outcome, "capped");
});

test("기록이 실패해도 응답은 나간다", async () => {
  const res = await runAsk(input, deps({ log: () => { throw new Error("db"); } }).d);
  assert.equal(res.outcome, "ai");
});

test("기록: Supabase 에 못 닿아도 던지지 않는다", async () => {
  process.env.SUPABASE_URL = "http://127.0.0.1:9";
  process.env.SUPABASE_KEY = "test";
  try {
    await writeLog({} as LogRow);
  } finally {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_KEY;
  }
});

test("하루 상한: 한국 시간 하루 100회, 다음 날 0시에 다시", async () => {
  const day1 = Date.parse("2026-11-09T14:59:00Z"); // 한국 11/9 23:59
  assert.equal(kstDay(day1), "2026-11-09");
  for (let i = 0; i < DAILY_CAP; i++) assert.equal(await takeSlot(day1), true);
  assert.equal(await takeSlot(day1), false);
  assert.equal(await takeSlot(day1 + 60_000), true); // 한국 11/10 00:00
});

test("가짜 llm.ts: 규칙대로 답하고, 파이프라인과 맞물린다", async () => {
  const signal = AbortSignal.timeout(1000);
  const c = await fakeLlm.toConditions("한강 소설 추천", signal);
  assert.ok(c.ok && c.value.keywords.join() === "한강,소설");
  assert.equal((await fakeLlm.toConditions("실패1 한강", signal)).ok, false);
  const { d, rows } = deps({ llm: fakeLlm });
  const res = await runAsk({ sentence: "밖 한강 소설", masked: 0 }, d);
  assert.deepEqual([res.outcome, res.fake, res.books.length, rows[0].guard_dropped], ["ai", true, 5, 1]);
  assert.equal((await runAsk({ sentence: "실패2 한강", masked: 0 }, deps({ llm: fakeLlm }).d)).outcome, "fallback");
});

test("lib/llm.ts 에 console 이 없고, 값 import 가 없다 (대표 파일 규칙)", () => {
  const src = readFileSync(new URL("../lib/llm.ts", import.meta.url), "utf8");
  assert.ok(!src.includes("console."));
  assert.ok(!/^import (?!type )/m.test(src));
});

const fakeHistory = () => ({ state: { __NA: true } as any, replaceState(data: unknown) { this.state = data; } });
const shown: Shown = {
  outcome: "ai",
  books: [{ isbn13: "9788936434120", title: "소년이 온다", authors: "한강", publisher: "창비", year: "2014", cover: "" }],
  keywords: [],
};

test("뒤로 오기: 지난 결과는 그 기록 칸에만 남고, 링크로 새로 들어온 칸에는 없다", () => {
  const h = fakeHistory();
  saveLast(h, shown);
  assert.equal(loadLast(h)?.books[0].title, "소년이 온다");
  assert.equal(h.state.__NA, true); // Next 가 쓰는 값은 그대로
  assert.equal(loadLast(fakeHistory()), null);
});

test("찾기: 지난 결과를 먼저 지워서 새 찾기가 실패해도 옛 결과가 남지 않고, 문장은 남기지 않는다", async () => {
  const h = fakeHistory();
  saveLast(h, shown);
  let seen: unknown = "아직";
  const down = (async () => {
    seen = loadLast(h);
    throw new TypeError("망 끊김");
  }) as typeof fetch;
  assert.equal(await ask("공룡 그림책", h, down), null);
  assert.equal(seen, null);
  assert.equal(loadLast(h), null);
  const ok = (async () => Response.json(shown)) as typeof fetch;
  assert.equal((await ask("공룡 그림책", h, ok))?.books.length, 1);
  assert.equal(loadLast(h)?.books.length, 1);
  assert.ok(!JSON.stringify(h.state).includes("공룡"));
});
