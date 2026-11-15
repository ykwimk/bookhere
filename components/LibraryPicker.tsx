'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SIDO, sigunguOf } from '@/lib/regions';
import { MAX_LIBRARIES, saveLibraries } from '@/lib/storage';
import { useLibraries } from '@/lib/useLibraries';
import { ChevronDownIcon } from './Icons';
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
        if (ctrl.signal.aborted) return;
        setLibs('error');
        // 시·도를 비워 둬야 같은 시·도를 다시 골랐을 때 값이 바뀌어 다시 받는다
        setRegion('');
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

  // 상자 대신 먹색 밑줄 하나. 초점은 버튼과 같은 먹색 2px 테두리 (globals.css). 기본 화살표를 지운 자리에 아래 꺾쇠를 그린다. 고르기·키보드는 브라우저 기본 그대로
  // 아직 안 골랐으면 "고르세요" 를 안내 회색으로 (펼친 목록 글자는 먹색 그대로)
  const selectClass =
    'block h-12 w-full cursor-pointer appearance-none rounded-none border-b border-ink bg-paper pr-8 text-[16px] font-medium *:text-ink';
  const caret = (
    <ChevronDownIcon className="text-muted pointer-events-none absolute top-1/2 right-1 size-5 -translate-y-1/2" />
  );
  // 이름표 (시·도, 시·군·구, ○○ 도서관): 화면의 목소리 고딕 800
  const label = 'block text-[15px] font-extrabold';

  const done = (
    <Link
      href={returnIsbn ? `/book/${returnIsbn}` : '/'}
      className="bg-ink flex h-12 w-full items-center justify-center rounded-[10px] px-9 text-[16px] font-bold text-white hover:bg-black active:scale-[0.98] lg:w-fit"
    >
      {returnIsbn ? '고른 도서관으로 결과 보기' : '다 골랐어요'}
    </Link>
  );

  // PC 는 홈과 같은 두 칸 (globals.css .cols): 옆 칸에 제목·고른 도서관·다 골랐어요 (목록을 내려도 고른 것과 단추가 보인다),
  // 큰 칸에 지역 고르기·목록. 휴대폰은 한 줄 그대로. 단추는 두 자리에 두고 한쪽만 보인다
  // (order 로 옮기면 Tab·화면 읽기 순서가 보이는 순서와 달라진다). 옆 칸이 창보다 길면 칸 안에서 내린다 (cols-side-scroll)
  return (
    <div className="cols flex flex-col gap-12">
      <div className="cols-side cols-side-scroll lg:space-y-10">
        <div>
          <h1 className="text-[22px] leading-[1.35] font-extrabold tracking-[-0.03em] text-balance lg:text-[26px]">
            내 도서관 고르기
          </h1>
          <p className="text-ink-2 mt-2 text-[15px]">
            자주 가는 도서관을 {MAX_LIBRARIES}곳까지 고르세요. 집 근처와 회사
            근처처럼 시·도가 달라도 돼요. 이 브라우저에만 저장돼요.
          </p>
        </div>

        <section aria-label="고른 도서관">
          <h2 className="text-[15px] font-extrabold">
            고른 도서관 {mine.length}/{MAX_LIBRARIES}
          </h2>
          {mine.length === 0 ? (
            <p className="text-ink-2 mt-1 text-[15px]">
              아직 없어요. 지역을 고르세요.
            </p>
          ) : (
            <ul className="mt-3">
              {mine.map((l) => (
                <li
                  key={l.code}
                  className="border-line flex items-center justify-between gap-3 border-t py-3"
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
                    className="text-ink-2 hover:text-ink inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-end px-1 text-[14px] font-semibold underline underline-offset-4"
                    aria-label={`${l.name} 빼기`}
                  >
                    빼기
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* 3곳을 넘겨 고르려 할 때의 안내. 긴 목록 아래가 아니라 고른 도서관 바로 아래에 */}
          <p
            role="status"
            aria-live="polite"
            className="text-warn text-[15px] [&:not(:empty)]:mt-2"
          >
            {notice}
          </p>
          {saveFailed && (
            <p className="text-warn mt-2 text-sm">
              이 브라우저에 저장하지 못했어요. 사생활 보호 모드라면 창을 닫을 때
              지워져요.
            </p>
          )}
        </section>

        {/* 1곳 이상 골랐을 때만 (휴대폰 아래 띠와 같은 기준). 0곳이면 첫 할 일 시·도 고르기보다 먼저 눈에 띄지 않게 */}
        {mine.length > 0 && <div className="hidden lg:block">{done}</div>}
      </div>

      {/* PC 는 시·도와 시·군·구를 한 줄에 나란히 (넓은 칸에서 밑줄이 길게 늘어지지 않고 목록이 위로 올라온다) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <label className={label}>
          시·도
          <span className="relative mt-1 block">
            <select
              value={region}
              onChange={(e) => pickRegion(e.target.value)}
              className={`${selectClass} ${region ? '' : 'text-hint'}`}
            >
              <option value="">고르세요</option>
              {SIDO.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            {caret}
          </span>
        </label>

        {/* 받고 나면 다음에 나오는 것은 시·군·구 칸이라, 그 칸(이름 15px + 입력 h-12) 모양으로 자리를 잡는다 */}
        {libs === 'loading' && (
          <div>
            <p role="status" className="sr-only">
              도서관 목록을 받는 중…
            </p>
            <Skeleton className="my-1 h-4 w-16 rounded" />
            <Skeleton className="mt-1 h-12 rounded-md" />
          </div>
        )}
        {libs === 'error' && (
          <p
            role="status"
            className="text-warn border-warn border-t pt-4 lg:col-span-2"
          >
            도서관 목록을 받지 못했어요. 잠시 뒤 시·도를 다시 골라 주세요.
          </p>
        )}
        {Array.isArray(libs) && libs.length === 0 && (
          <p className="text-ink-2 lg:col-span-2">
            이 지역에서 받은 도서관이 없어요.
          </p>
        )}

        {areas.length > 0 && (
          <label className={label}>
            시·군·구
            <span className="relative mt-1 block">
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className={`${selectClass} ${area ? '' : 'text-hint'}`}
              >
                <option value="">고르세요</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {caret}
            </span>
          </label>
        )}

        {shown.length > 0 && (
          <fieldset className="lg:col-span-2">
            <legend className={label}>{area} 도서관</legend>
            <ul className="mt-3">
              {shown.map((l) => (
                <li key={l.code} className="border-line border-t">
                  <label className="group flex min-h-14 cursor-pointer items-center gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={mine.some((m) => m.code === l.code)}
                      onChange={() => toggle(l)}
                      className="accent-ink size-5 shrink-0 scroll-mb-24"
                    />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium group-hover:underline group-hover:underline-offset-4">
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
      </div>

      {/* 휴대폰: 1곳이라도 고르면 긴 목록 중에도 화면 아래에 붙어 있다 (목록 끝까지 내리지 않아도 됨).
          뒤 목록 글자가 비치지 않게 종이 띠 위에 (그림자 없음) */}
      <div
        className={`lg:hidden ${mine.length ? 'bg-paper sticky bottom-0 py-4' : ''}`}
      >
        {done}
      </div>
    </div>
  );
}
