// 문장 찾기 평가. 실행: node --env-file=.env.local eval/run.ts [--snapshot]  (npm test 에 넣지 않는다: 진짜 LLM 을 부른다)
// - 질문 eval/questions.json 을 앱과 같은 파이프라인 (lib/ask/run.ts) 으로 한 번씩 돌리고, 채점은 코드로 한다 (LLM 심판 없음)
// - ② 는 늘 스냅샷 후보 (eval/snapshots/<id>.json, git 에 안 올림) 로 고른다 → 프롬프트·모델 차이만 보인다
// - --snapshot 이거나 스냅샷이 없을 때만 정보나루에서 새로 받는다 (DATA4LIBRARY_KEY 필요, 문항당 1~2건)
// - 결과 파일 eval/results/<날짜>-<판>-<모델>.json 에는 이유 글·제목을 넣지 않는다. 틀린 것 5개는 터미널에만
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import * as llm from '../lib/llm.ts';
import { cleanSentence } from '../lib/ask/guard.ts';
import { searchCandidates } from '../lib/ask/find.ts';
import { runAsk } from '../lib/ask/run.ts';
import { isApiError } from '../lib/parse.ts';
import { kstDay } from '../lib/ask/log.ts';
import type {
  AskResponse,
  Conditions,
  Found,
  LogRow,
} from '../lib/ask/types.ts';

type OneOrMany = string | string[];
type Question = {
  id: string;
  sentence: string;
  expect: {
    keywords?: string[];
    age?: OneOrMany;
    kdc?: OneOrMany;
    addCode?: OneOrMany;
  };
  goodIsbns?: string[];
  badIsbns?: string[];
  memo?: string;
};
type Snap = Omit<Found, 'cover' | 'loans'>;

const dir = new URL('./', import.meta.url);
const path = (p: string) => new URL(p, dir);
const hash = (s: string) =>
  createHash('sha256').update(s).digest('hex').slice(0, 8);
const many = (v: OneOrMany | undefined) =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

const questionsText = readFileSync(path('questions.json'), 'utf8');
const questions: Question[] = JSON.parse(questionsText);
for (const q of questions) {
  if (!/^[\w-]+$/.test(q.id) || typeof q.sentence !== 'string' || !q.expect)
    throw new Error(`questions.json 모양이 다름: ${q.id}`);
}

// 스냅샷: expect 조건으로 정보나루 후보를 받는다 (앱과 같은 searchCandidates, 표지·대출 수 없이 저장)
async function d4l(
  api: string,
  params: Record<string, string>,
): Promise<unknown> {
  const key = process.env.DATA4LIBRARY_KEY;
  if (!key)
    throw new Error('스냅샷이 없는데 DATA4LIBRARY_KEY 가 없다 (.env.local)');
  const res = await fetch(
    `https://data4library.kr/api/${api}?${new URLSearchParams({ ...params, authKey: key, format: 'json' })}`,
    {
      signal: AbortSignal.timeout(15000),
    },
  );
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok || isApiError(body))
    throw new Error(`정보나루 ${api} 실패 (HTTP ${res.status})`); // 주소에 키가 있어 주소는 찍지 않는다
  return body;
}

async function snapshot(q: Question): Promise<Snap[]> {
  const file = path(`snapshots/${q.id}.json`);
  if (existsSync(file) && !process.argv.includes('--snapshot'))
    return JSON.parse(readFileSync(file, 'utf8'));
  const e = q.expect;
  const cond: Conditions = {
    keywords: e.keywords?.slice(0, 1) ?? [], // 채점은 "하나라도"라서 검색도 첫 값 하나로 (여럿이면 정보나루가 AND)
    age: many(e.age)[0] ?? null,
    kdc: many(e.kdc)[0] ?? null,
    addCode: many(e.addCode)[0] ?? null,
  };
  const { found } = await searchCandidates(d4l, cond, Date.now());
  const snap: Snap[] = found.map(({ cover: _c, loans: _l, ...rest }) => rest);
  mkdirSync(path('snapshots/'), { recursive: true });
  writeFileSync(file, JSON.stringify(snap, null, 1));
  return snap;
}

const snaps = new Map<string, Snap[]>();
for (const q of questions) snaps.set(q.id, await snapshot(q));
const snapshotHash = hash(
  questions.map((q) => JSON.stringify(snaps.get(q.id))).join('\n'),
);

// 채점
const items = [];
const wrong: { q: Question; res: AskResponse; row: LogRow }[] = [];
let picked = 0;
let pickedOk = 0;
let goodAll = 0;
let goodHit = 0;
for (const q of questions) {
  const snap = snaps.get(q.id)!;
  const found: Found[] = snap.map((s, i) => ({
    ...s,
    cover: '',
    loans: snap.length - i,
  }));
  const rows: LogRow[] = [];
  const input = cleanSentence(q.sentence);
  if (!input) throw new Error(`문장이 비었거나 200자를 넘는다: ${q.id}`);
  const res = await runAsk(input, {
    llm,
    find: async () => ({ found, calls: 0 }),
    takeSlot: async () => true,
    log: (row) => rows.push(row),
    now: Date.now,
  });
  const row = rows[0];
  const c = row.conditions;
  const e = q.expect;
  const condOk =
    !!c &&
    (!e.keywords || e.keywords.some((k) => c.keywords.includes(k))) &&
    (!e.age || many(e.age).includes(c.age ?? '')) &&
    (!e.kdc || many(e.kdc).includes(c.kdc ?? '')) &&
    (!e.addCode || many(e.addCode).includes(c.addCode ?? ''));
  // 고른 책이 조건에 맞나: KDC 앞자리·부가기호 첫 자리·나오면 안 되는 책. 연령은 책에 칸이 없어 안 잰다
  const byIsbn = new Map(snap.map((s) => [s.isbn13, s]));
  const bookOk = row.picks.filter((isbn) => {
    const b = byIsbn.get(isbn);
    return (
      !!b &&
      (!e.kdc || many(e.kdc).some((k) => b.classNo.startsWith(k))) &&
      (!e.addCode || many(e.addCode).some((a) => b.addCode.startsWith(a))) &&
      !q.badIsbns?.includes(isbn)
    );
  }).length;
  picked += row.picks.length;
  pickedOk += bookOk;
  goodAll += q.goodIsbns?.length ?? 0;
  goodHit += q.goodIsbns?.filter((g) => row.picks.includes(g)).length ?? 0;
  const ms = (row.llm1_ms ?? 0) + (row.llm2_ms ?? 0);
  items.push({
    id: q.id,
    outcome: row.outcome,
    conditions: c,
    condOk,
    picks: row.picks,
    bookOk,
    guardDropped: row.guard_dropped,
    reasonsCut: row.reasons_cut,
    fail: row.fail_step && {
      step: row.fail_step,
      kind: row.fail_kind,
      status: row.status,
    },
    ms,
    tokens: {
      llm1: [row.llm1_in, row.llm1_out],
      llm2: [row.llm2_in, row.llm2_out],
    },
    cost: row.cost_usd,
  });
  if (!condOk || bookOk < row.picks.length || row.outcome !== 'ai')
    wrong.push({ q, res, row });
}

const n = questions.length;
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const msSorted = items.map((i) => i.ms).sort((a, b) => a - b);
const at = (p: number) => msSorted[Math.max(0, Math.ceil(p * n) - 1)] ?? 0;
const summary = {
  condRate: pct(items.filter((i) => i.condOk).length, n), // ① %
  bookRate: pct(pickedOk, picked), // ② %
  goodRate: goodAll ? pct(goodHit, goodAll) : null, // ② 정답 ISBN 이 5권 안에 든 비율 %
  guardDropped: items.reduce((s, i) => s + i.guardDropped, 0), // ③ 0 이 아니면 그 판 불합격
  fallbackRate: pct(items.filter((i) => i.outcome !== 'ai').length, n), // ④ %
  msMedian: at(0.5), // ⑤
  msP90: at(0.9),
  costAvg: Number((items.reduce((s, i) => s + i.cost, 0) / n).toFixed(6)), // ⑥ $
};

const date = kstDay(Date.now());
const base = `${date}-${llm.PROMPT_VERSION}-${llm.MODEL}`.replace(
  /[^\w.-]/g,
  '_',
);
mkdirSync(path('results/'), { recursive: true });
let name = `${base}.json`;
for (let i = 2; existsSync(path(`results/${name}`)); i++)
  name = `${base}-${i}.json`;
const questionsHash = hash(questionsText);
writeFileSync(
  path(`results/${name}`),
  JSON.stringify(
    {
      date,
      promptVersion: llm.PROMPT_VERSION,
      model: llm.MODEL,
      questionsHash,
      snapshotHash,
      summary,
      items,
    },
    null,
    1,
  ) + '\n',
);
const s = summary;
// 가짜 llm 판은 결과 파일만 (git 에 안 올림), 비교표에는 넣지 않는다
if (llm.PROMPT_VERSION !== 'fake')
  appendFileSync(
    path('README.md'),
    `| ${date} | ${llm.PROMPT_VERSION} | ${llm.MODEL} | ${questionsHash}·${snapshotHash} | ${s.condRate}% | ${s.bookRate}% (${s.goodRate ?? '-'}${s.goodRate === null ? '' : '%'}) | ${s.guardDropped} | ${s.fallbackRate}% | ${s.msMedian}·${s.msP90}ms | $${s.costAvg} | |\n`,
  );

console.log(`결과 eval/results/${name}`);
console.log(JSON.stringify(summary));
// 틀린 것 5개: 터미널에만 (문장·이유·제목은 파일에 남기지 않는다)
for (const { q, res, row } of wrong.slice(0, 5)) {
  console.log(`\n✗ ${q.id} ${q.sentence}`);
  console.log(
    `  기대 ${JSON.stringify(q.expect)}${q.memo ? ` / 메모 ${q.memo}` : ''}`,
  );
  console.log(
    `  조건 ${JSON.stringify(row.conditions)} / ${row.outcome}${row.fail_step ? ` (${row.fail_step} ${row.fail_kind})` : ''}`,
  );
  for (const b of res.books.slice(0, 5))
    console.log(`  - ${b.title}${b.reason ? ` — ${b.reason}` : ''}`);
}
