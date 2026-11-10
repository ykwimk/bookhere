'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SIDO, sigunguOf } from '@/lib/regions';
import { MAX_LIBRARIES, saveLibraries } from '@/lib/storage';
import { useLibraries } from '@/lib/useLibraries';
import Skeleton from './Skeleton';
import type { Library } from '@/lib/types';

// 화면 ①: 시·도 → 시·군·구 → 도서관 체크 (최대 3곳). 고른 것은 이 브라우저에만 저장한다.
export default function LibraryPicker({
  returnIsbn,
}: {
  returnIsbn: string | null;
}) {
  // 고친 뒤에는 고친 값을 보인다 (저장이 실패해도 이 화면에서는 고른 대로)
  const [edited, setEdited] = useState<Library[] | null>(null);
  const stored = useLibraries();
  const mine = edited ?? stored ?? [];
  const [region, setRegion] = useState('');
  const [area, setArea] = useState('');
  const [libs, setLibs] = useState<Library[] | 'loading' | 'error' | null>(
    null,
  );
  const [notice, setNotice] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    if (!region) return;
    const ctrl = new AbortController();
    fetch(`/api/libraries?region=${region}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { libraries: Library[] }) => setLibs(d.libraries))
      .catch(() => {
        if (!ctrl.signal.aborted) setLibs('error');
      });
    return () => ctrl.abort();
  }, [region]);

  // 지역을 비우면 받은 목록은 그대로 둔다
  function pickRegion(next: string) {
    setRegion(next);
    if (!next) return;
    setLibs('loading');
    setArea('');
  }

  function update(next: Library[]) {
    setEdited(next);
    setSaveFailed(!saveLibraries(next));
    setNotice('');
  }

  function toggle(lib: Library) {
    if (mine.some((m) => m.code === lib.code))
      return update(mine.filter((m) => m.code !== lib.code));
    if (mine.length >= MAX_LIBRARIES) {
      return setNotice(
        `최대 ${MAX_LIBRARIES}곳까지 고를 수 있어요. 위에서 하나를 빼고 다시 고르세요.`,
      );
    }
    update([...mine, lib]);
  }

  const list = Array.isArray(libs) ? libs : [];
  const areas = [...new Set(list.map((l) => sigunguOf(l.address)))].sort(
    (a, b) => a.localeCompare(b, 'ko'),
  );
  const shown = list.filter((l) => sigunguOf(l.address) === area);
  // 고른 도서관이 지금 목록에 없으면 폐관했거나 정보나루 수집이 멈췄을 수 있다
  const missing = (l: Library) =>
    Array.isArray(libs) &&
    l.region === region &&
    !libs.some((x) => x.code === l.code);

  const selectClass =
    'mt-2 block h-12 w-full rounded-xl border border-control bg-paper px-4 text-[16px] font-normal hover:border-muted';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[24px] leading-[1.35] font-bold tracking-[-0.02em] text-balance">
          내 도서관 고르기
        </h1>
        <p className="text-muted mt-2 text-[15px]">
          자주 가는 도서관을 {MAX_LIBRARIES}곳까지 고르세요. 집 근처와 회사
          근처처럼 시·도가 달라도 돼요. 이 브라우저에만 저장돼요.
        </p>
      </div>

      <section aria-label="고른 도서관">
        <h2 className="text-[16px] font-bold">
          고른 도서관 {mine.length}/{MAX_LIBRARIES}
        </h2>
        {mine.length === 0 ? (
          <p className="text-muted mt-1 text-[15px]">
            아직 없어요. 아래에서 지역을 고르세요.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {mine.map((l) => (
              <li
                key={l.code}
                className="bg-card flex items-center justify-between gap-3 rounded-[20px] px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold">{l.name}</p>
                  <p className="text-muted text-sm">{sigunguOf(l.address)}</p>
                  {missing(l) && (
                    <p className="text-warn text-sm">
                      지금 목록에 없어요. 폐관했거나 자료 수집이 멈췄을 수
                      있어요.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggle(l)}
                  className="bg-paper hover:bg-raised min-h-11 shrink-0 rounded-xl px-4 text-[14px] font-medium active:scale-[0.98]"
                  aria-label={`${l.name} 빼기`}
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>
        )}
        {saveFailed && (
          <p className="text-warn mt-2 text-sm">
            이 브라우저에 저장하지 못했어요. 사생활 보호 모드라면 창을 닫을 때
            지워져요.
          </p>
        )}
      </section>

      <div className="space-y-5">
        <label className="block text-[15px] font-semibold">
          시·도
          <select
            value={region}
            onChange={(e) => pickRegion(e.target.value)}
            className={selectClass}
          >
            <option value="">고르세요</option>
            {SIDO.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {/* 받고 나면 다음에 나오는 것은 시·군·구 칸이라, 그 칸(이름 15px + 입력 h-12) 모양으로 자리를 잡는다 */}
        {libs === 'loading' && (
          <div>
            <p role="status" className="sr-only">
              도서관 목록을 받는 중…
            </p>
            <Skeleton className="my-1 h-4 w-16 rounded" />
            <Skeleton className="mt-2 h-12 rounded-xl" />
          </div>
        )}
        {libs === 'error' && (
          <p role="status" className="text-warn">
            도서관 목록을 받지 못했어요. 잠시 뒤 시·도를 다시 골라 주세요.
          </p>
        )}
        {Array.isArray(libs) && libs.length === 0 && (
          <p className="text-muted">이 지역에서 받은 도서관이 없어요.</p>
        )}

        {areas.length > 0 && (
          <label className="block text-[15px] font-semibold">
            시·군·구
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={selectClass}
            >
              <option value="">고르세요</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        )}

        {shown.length > 0 && (
          <fieldset>
            <legend className="text-[15px] font-semibold">{area} 도서관</legend>
            <ul className="divide-line bg-card mt-2 divide-y overflow-hidden rounded-[20px]">
              {shown.map((l) => (
                <li key={l.code}>
                  <label className="hover:bg-raised/60 flex min-h-14 cursor-pointer items-center gap-3 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={mine.some((m) => m.code === l.code)}
                      onChange={() => toggle(l)}
                      className="accent-accent size-5 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium">
                        {l.name}
                      </span>
                      <span className="text-muted block text-sm">
                        {l.address}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <p role="status" aria-live="polite" className="text-warn text-[15px]">
          {notice}
        </p>
      </div>

      <Link
        href={returnIsbn ? `/book/${returnIsbn}` : '/'}
        className="bg-accent hover:bg-accent-ink flex h-12 items-center justify-center rounded-xl font-semibold text-white active:scale-[0.98]"
      >
        {returnIsbn ? '고른 도서관으로 결과 보기' : '다 골랐어요'}
      </Link>
    </div>
  );
}
