import { after } from 'next/server';
import * as llm from '@/lib/llm';
import { findCandidates } from '@/lib/data4library';
import { askOpen, cleanSentence } from '@/lib/ask/guard';
import { takeSlot, writeLog } from '@/lib/ask/log';
import { runAsk } from '@/lib/ask/run';

// POST /api/ask { sentence } → { outcome, books, keywords?, fake }
// 문장은 본문으로만 받는다: 주소(?q=)는 Vercel 요청 기록·방문 집계·브라우저 기록에 남는다.
// JSON 만 받는다: 다른 사이트의 폼·이미지가 우리 LLM 을 부르지 못하게 (브라우저가 사전 확인을 하게 만든다).
export async function POST(req: Request) {
  if (
    !askOpen(
      llm.PROMPT_VERSION,
      process.env.VERCEL_ENV,
      process.env.ASK_LAUNCHED,
    )
  )
    return Response.json({ error: 'not found' }, { status: 404 });
  const bad = () => Response.json({ error: 'bad request' }, { status: 400 });
  if (!req.headers.get('content-type')?.startsWith('application/json'))
    return bad();
  const text = await req.text();
  if (text.length > 2000) return bad();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return bad();
  }
  const input = cleanSentence(
    (body as { sentence?: unknown } | null)?.sentence,
  );
  if (!input) return bad();
  const res = await runAsk(input, {
    llm,
    find: findCandidates,
    takeSlot: () => takeSlot(Date.now()),
    log: (row) => after(() => writeLog(row)),
    now: Date.now,
  });
  return Response.json(res);
}
