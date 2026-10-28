"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Library } from "@/lib/types";
import { SIDO, sigunguOf } from "@/lib/regions";
import { MAX_LIBRARIES, loadLibraries, saveLibraries } from "@/lib/storage";

// 화면 ①: 시·도 → 시·군·구 → 도서관 체크 (최대 3곳). 고른 것은 이 브라우저에만 저장한다.
export default function LibraryPicker({ returnIsbn }: { returnIsbn: string | null }) {
  const [mine, setMine] = useState<Library[]>([]);
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [libs, setLibs] = useState<Library[] | "loading" | "error" | null>(null);
  const [notice, setNotice] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => setMine(loadLibraries()), []);

  useEffect(() => {
    if (!region) return;
    const ctrl = new AbortController();
    setLibs("loading");
    setArea("");
    fetch(`/api/libraries?region=${region}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { libraries: Library[] }) => setLibs(d.libraries))
      .catch(() => {
        if (!ctrl.signal.aborted) setLibs("error");
      });
    return () => ctrl.abort();
  }, [region]);

  function update(next: Library[]) {
    setMine(next);
    setSaveFailed(!saveLibraries(next));
    setNotice("");
  }

  function toggle(lib: Library) {
    if (mine.some((m) => m.code === lib.code)) return update(mine.filter((m) => m.code !== lib.code));
    if (mine.length >= MAX_LIBRARIES) {
      return setNotice(`최대 ${MAX_LIBRARIES}곳까지 고를 수 있어요. 위에서 하나를 빼고 다시 고르세요.`);
    }
    update([...mine, lib]);
  }

  const list = Array.isArray(libs) ? libs : [];
  const areas = [...new Set(list.map((l) => sigunguOf(l.address)))].sort((a, b) => a.localeCompare(b, "ko"));
  const shown = list.filter((l) => sigunguOf(l.address) === area);
  // 고른 도서관이 지금 목록에 없으면 폐관했거나 정보나루 수집이 멈췄을 수 있다
  const missing = (l: Library) => Array.isArray(libs) && l.region === region && !libs.some((x) => x.code === l.code);

  const selectClass = "mt-2 block h-14 w-full rounded-2xl border border-control bg-paper px-4 text-[17px] font-normal hover:border-muted";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-[28px] font-extrabold leading-[1.3] tracking-[-0.03em] text-balance sm:text-[32px]">내 도서관 고르기</h1>
        <p className="mt-3 text-[16px] text-muted">
          자주 가는 도서관을 {MAX_LIBRARIES}곳까지 고르세요. 집 근처와 회사 근처처럼 시·도가 달라도 돼요. 이 브라우저에만 저장돼요.
        </p>
      </div>

      <section aria-label="고른 도서관">
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em]">
          고른 도서관 {mine.length}/{MAX_LIBRARIES}
        </h2>
        {mine.length === 0 ? (
          <p className="mt-1 text-[15px] text-muted">아직 없어요. 아래에서 지역을 고르세요.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {mine.map((l) => (
              <li key={l.code} className="flex items-center justify-between gap-3 rounded-[20px] bg-card px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[17px] font-bold">{l.name}</p>
                  <p className="text-sm text-muted">{sigunguOf(l.address)}</p>
                  {missing(l) && (
                    <p className="text-sm text-warn">지금 목록에 없어요. 폐관했거나 자료 수집이 멈췄을 수 있어요.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggle(l)}
                  className="min-h-11 shrink-0 rounded-xl bg-paper px-4 text-[15px] font-bold hover:bg-raised active:scale-[0.98]"
                  aria-label={`${l.name} 빼기`}
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>
        )}
        {saveFailed && (
          <p className="mt-2 text-sm text-warn">
            이 브라우저에 저장하지 못했어요. 사생활 보호 모드라면 창을 닫을 때 지워져요.
          </p>
        )}
      </section>

      <div className="space-y-5">
        <label className="block text-[15px] font-bold">
          시·도
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
            <option value="">고르세요</option>
            {SIDO.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {libs === "loading" && <p role="status" className="text-muted">도서관 목록을 받는 중…</p>}
        {libs === "error" && (
          <p role="status" className="text-warn">
            도서관 목록을 받지 못했어요. 잠시 뒤 시·도를 다시 골라 주세요.
          </p>
        )}
        {Array.isArray(libs) && libs.length === 0 && <p className="text-muted">이 지역에서 받은 도서관이 없어요.</p>}

        {areas.length > 0 && (
          <label className="block text-[15px] font-bold">
            시·군·구
            <select value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
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
            <legend className="text-[15px] font-bold">{area} 도서관</legend>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-[20px] bg-card">
              {shown.map((l) => (
                <li key={l.code}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-5 py-3 hover:bg-raised/60">
                    <input
                      type="checkbox"
                      checked={mine.some((m) => m.code === l.code)}
                      onChange={() => toggle(l)}
                      className="size-5 shrink-0 accent-accent"
                    />
                    <span className="min-w-0">
                      <span className="block font-semibold">{l.name}</span>
                      <span className="block text-sm text-muted">{l.address}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <p role="status" aria-live="polite" className="text-[15px] text-warn">
          {notice}
        </p>
      </div>

      <Link
        href={returnIsbn ? `/book/${returnIsbn}` : "/"}
        className="flex h-14 items-center justify-center rounded-2xl bg-accent font-bold text-white hover:bg-accent-ink active:scale-[0.98]"
      >
        {returnIsbn ? "고른 도서관으로 결과 보기" : "다 골랐어요"}
      </Link>
    </div>
  );
}
