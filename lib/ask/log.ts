// 문장 찾기 기록 (Supabase ask_log, 서울 리전) 과 하루 상한. 서버 전용.
// 계정 전 (SUPABASE_URL·SUPABASE_KEY 가 없으면): 같은 행을 콘솔에 JSON 한 줄, 상한은 이 인스턴스 메모리로 센다.
// 연결은 패키지 없이 PostgREST fetch. 키 종류·RLS·헤더는 연결할 때 🛡 security 가 검수한다 (지금은 한 번도 돌려 보지 않은 코드).
import type { LogRow } from './types.ts';

export const DAILY_CAP = 100; // 한국 시간 0시 기준. 정보나루 최대 200건 (팀장 11/9)
const TIMEOUT_MS = 1500;
const COUNT_TTL_MS = 60_000;

const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return url && key
    ? {
        url: `${url.replace(/\/$/, '')}/rest/v1/ask_log`,
        headers: { apikey: key },
      }
    : null;
};

const reason = (e: unknown) => (e instanceof Error ? e.name : 'unknown');

/** 응답 뒤에 부른다 (라우트 after()). 던지지 않는다: 실패는 콘솔에 종류만. */
export async function writeLog(row: LogRow): Promise<void> {
  const db = supabase();
  if (!db) {
    console.log(`[ask-log] ${JSON.stringify(row)}`); // 문장·이유·IP 가 없는 행이라 콘솔도 된다 (기획서 "기록")
    return;
  }
  try {
    const res = await fetch(db.url, {
      method: 'POST',
      headers: {
        ...db.headers,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`[ask-log] 실패 HTTP ${res.status}`);
  } catch (e) {
    console.error(`[ask-log] 실패 ${reason(e)}`);
  }
}

export const kstDay = (now: number) =>
  new Date(now + 9 * 3600e3).toISOString().slice(0, 10);

/** 오늘 (KST) LLM 을 부른 행 수. Content-Range "0-0/42" 의 42. */
async function countToday(
  db: NonNullable<ReturnType<typeof supabase>>,
  day: string,
): Promise<number> {
  const q = new URLSearchParams({
    select: 'at',
    at: `gte.${day}T00:00:00+09:00`,
    outcome: 'neq.capped',
  });
  const res = await fetch(`${db.url}?${q}`, {
    headers: { ...db.headers, Prefer: 'count=exact', Range: '0-0' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const n = Number(res.headers.get('content-range')?.split('/')[1]);
  if (!res.ok || !Number.isInteger(n)) throw new Error('count');
  return n;
}

let used = { day: '', n: 0, checkedAt: 0 };

/** 하루 상한 안이면 true 를 주고 하나 센다. Supabase 행 수는 60초마다 다시 읽고, 못 읽으면 메모리로 센다.
 *  shortcut: 여러 인스턴스가 동시에 돌면 60초 사이에 100을 조금 넘을 수 있다. 돈의 마지막 상한은 대표가 거는 제공사 월 한도. */
export async function takeSlot(now: number): Promise<boolean> {
  const day = kstDay(now);
  if (used.day !== day) used = { day, n: 0, checkedAt: 0 };
  const db = supabase();
  if (db && now - used.checkedAt > COUNT_TTL_MS) {
    used.checkedAt = now; // 실패해도 60초는 다시 묻지 않는다
    try {
      used.n = await countToday(db, day);
    } catch (e) {
      console.error(`[ask-log] 세기 실패 ${reason(e)}`);
    }
  }
  if (used.n >= DAILY_CAP) return false;
  used.n++;
  return true;
}
