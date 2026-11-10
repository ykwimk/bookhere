// 문장 찾기 기록 (Supabase ask_log, 서울 리전) 과 하루 상한. 서버 전용. 표·함수·권한은 supabase/ask.sql.
// 계정 전 (SUPABASE_URL·SUPABASE_KEY 가 없으면): 같은 행을 콘솔에 JSON 한 줄, 상한은 이 인스턴스 메모리로 센다.
// 연결은 패키지 없이 PostgREST fetch. 키는 secret key (sb_secret_…) 를 apikey 헤더로만 (JWT 가 아니라 Authorization 에 안 넣는다).
import type { LogRow } from './types.ts';

export const DAILY_CAP = 100; // 한국 시간 0시 기준. 정보나루 최대 200건 (팀장 11/9)
const TIMEOUT_MS = 1500;

const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return url && key
    ? {
        rest: `${url.replace(/\/$/, '')}/rest/v1`,
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
    const res = await fetch(`${db.rest}/ask_log`, {
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

let used = { day: '', n: 0 };

/** 하루 상한 안이면 true 를 주고 하나 센다. Supabase 함수 ask_take_slot 이 모든 인스턴스를 한 번에 센다.
 *  환경변수가 없거나 함수가 실패·시간 초과면 이 인스턴스 메모리로 센다 (검색은 막지 않는다). */
export async function takeSlot(now: number): Promise<boolean> {
  const day = kstDay(now);
  if (used.day !== day) used = { day, n: 0 };
  const db = supabase();
  if (db) {
    try {
      const res = await fetch(`${db.rest}/rpc/ask_take_slot`, {
        method: 'POST',
        headers: { ...db.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cap: DAILY_CAP }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const ok: unknown = res.ok ? await res.json() : null;
      if (typeof ok === 'boolean') {
        if (ok) used.n++; // 함수가 나중에 실패해도 이 인스턴스가 쓴 만큼은 메모리에 남긴다
        return ok;
      }
      console.error(`[ask-log] 세기 실패 HTTP ${res.status}`);
    } catch (e) {
      console.error(`[ask-log] 세기 실패 ${reason(e)}`);
    }
  }
  if (used.n >= DAILY_CAP) return false;
  used.n++;
  return true;
}
