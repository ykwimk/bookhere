// 내 도서관 3곳은 이 브라우저(localStorage)에만 저장한다. 사생활 보호 모드 등에서 막히면 조용히 빈 값.
import { isLibCode } from './validate';
import { safeUrl } from './parse';
import type { Library } from './types';

const KEY = 'bookhere:libraries:v1';
export const MAX_LIBRARIES = 3;

function parse(raw: string | null): Library[] {
  try {
    const v: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(v)) return [];
    // 저장값도 밖에서 온 값으로 본다 (손으로 고칠 수 있음)
    return v
      .filter(
        (l) =>
          typeof l?.code === 'string' &&
          isLibCode(l.code) &&
          typeof l.name === 'string',
      )
      .slice(0, MAX_LIBRARIES)
      .map((l) => ({
        code: l.code,
        name: l.name,
        address: String(l.address ?? ''),
        homepage: safeUrl(l.homepage),
        region: String(l.region ?? ''),
      }));
  } catch {
    return [];
  }
}

// 저장값 글자가 그대로면 같은 배열을 돌려준다 (useSyncExternalStore 는 바뀌지 않았으면 같은 값을 받아야 한다)
let cache: { raw: string | null; libs: Library[] } | undefined;
export function loadLibraries(): Library[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (cache?.raw !== raw) cache = { raw, libs: parse(raw) };
  return cache.libs;
}

export function saveLibraries(libs: Library[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(libs.slice(0, MAX_LIBRARIES)));
    return true;
  } catch {
    return false;
  }
}
