"use client";

import Link from "next/link";
import { useEffect, useState, type SyntheticEvent } from "react";
import type { Library } from "@/lib/types";
import { loanBaseLabel } from "@/lib/date";
import { isSido, sigunguOf } from "@/lib/regions";
import { loadLibraries } from "@/lib/storage";

type Result =
  | { code: string; ok: true; hasBook: boolean; loanAvailable: boolean; checkedAt: string }
  | { code: string; ok: false };

// 화면 ③의 본문: 내 도서관(없으면 공유한 사람의 도서관)마다 소장·어제 기준 대출, 다른 소장 도서관, 공유 버튼
export default function Availability({ isbn, shared }: { isbn: string; shared: Library | null }) {
  const [mine, setMine] = useState<Library[] | null>(null);
  const [results, setResults] = useState<Record<string, Result> | "error" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setMine(loadLibraries()), []);

  const targets = mine?.length ? mine : shared ? [shared] : [];
  const codes = targets.map((l) => l.code).join(",");
  const regions = [...new Set(targets.map((l) => l.region))].filter(isSido).join(",");

  useEffect(() => {
    if (!codes) return;
    const ctrl = new AbortController();
    setResults(null);
    fetch(`/api/availability?isbn=${isbn}&libs=${codes}&regions=${regions}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { results: Result[] }) => setResults(Object.fromEntries(d.results.map((x) => [x.code, x]))))
      .catch(() => {
        if (!ctrl.signal.aborted) setResults("error");
      });
    return () => ctrl.abort();
  }, [isbn, codes, regions, attempt]);

  if (!mine) return <div className="h-40" />;

  const pickHref = `/libraries?from=${isbn}`;
  if (!targets.length) {
    return (
      <div className="rounded-lg border border-line bg-white p-4">
        <p>내 도서관을 고르면 이 책이 있는지, 어제 마감 때 빌릴 수 있었는지 바로 보여 드려요.</p>
        <Link href={pickHref} className="mt-3 inline-flex min-h-11 items-center rounded-md bg-shelf px-4 font-semibold text-white">
          내 도서관 고르기
        </Link>
      </div>
    );
  }

  const ok =
    results && results !== "error"
      ? Object.values(results).filter((r): r is Extract<Result, { ok: true }> => r.ok)
      : [];
  const holder = targets.find((l) => {
    const r = results && results !== "error" ? results[l.code] : undefined;
    return r?.ok && r.hasBook;
  });
  const noneHas = ok.length === targets.length && !holder;

  return (
    <div className="space-y-6">
      <section aria-labelledby="mine-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="mine-title" className="text-lg font-bold">
            {mine.length ? "내 도서관" : "공유한 분이 고른 도서관"}
          </h2>
          {ok[0] && <p className="stamp text-[15px]">{loanBaseLabel(new Date(ok[0].checkedAt))} 마감 기준</p>}
        </div>

        {results === "error" && (
          <div role="status" className="mt-3 rounded-md border border-warn/40 p-3 text-[15px] text-warn">
            <p>조회가 몰려 지금은 확인하지 못했어요. 잠시 뒤 다시 확인하거나 도서관 홈페이지에서 보세요.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-2 min-h-11 rounded-md border border-warn/60 px-3 font-semibold"
            >
              다시 확인
            </button>
          </div>
        )}

        <ul className="mt-3 divide-y divide-line border-y border-line" aria-busy={results === null}>
          {targets.map((l) => (
            <LibraryRow key={l.code} lib={l} result={results === "error" ? "error" : results?.[l.code] ?? null} />
          ))}
        </ul>

        {noneHas && (
          <p className="mt-3 text-[15px] text-muted">
            고른 도서관에는 이 책이 없어요. 도서관에 희망도서 신청이나 상호대차(다른 도서관 책을 빌려오기)를 물어보세요.
          </p>
        )}
        {!mine.length && (
          <Link href={pickHref} className="mt-4 inline-flex min-h-11 items-center rounded-md bg-shelf px-4 font-semibold text-white">
            내 도서관으로 보기
          </Link>
        )}
      </section>

      {mine.length > 0 && <OtherHolders isbn={isbn} mine={mine} />}

      <ShareButton isbn={isbn} holder={holder ?? null} />
    </div>
  );
}

function Mark({ on, yes, no, offClass = "text-muted" }: { on: boolean; yes: string; no: string; offClass?: string }) {
  // 색만으로 구분하지 않는다: 기호(○/×)와 글자를 함께 쓴다
  return (
    <span className={on ? "font-semibold text-shelf" : offClass}>
      <span aria-hidden>{on ? "○" : "×"}</span> {on ? yes : no}
    </span>
  );
}

function LibraryRow({ lib, result }: { lib: Library; result: Result | "error" | null }) {
  return (
    <li className="py-3">
      <p className="font-semibold">{lib.name}</p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
        {result === null ? (
          <span className="text-muted">확인하는 중…</span>
        ) : result === "error" ? (
          <span className="text-muted">확인 못 함</span>
        ) : !result.ok ? (
          <span className="text-warn">
            정보나루에서 이 도서관 자료가 오지 않았어요. 폐관했거나 자료 수집이 멈췄을 수 있어요.{" "}
            <Link href="/libraries" className="underline underline-offset-2">
              도서관 바꾸기
            </Link>
          </span>
        ) : (
          <>
            <Mark on={result.hasBook} yes="소장" no="소장 안 함" />
            {result.hasBook && (
              <Mark on={result.loanAvailable} yes="어제 마감 때 대출 가능" no="어제 마감 때 모두 대출 중" offClass="text-warn" />
            )}
          </>
        )}
      </div>
      {lib.homepage ? (
        <a
          href={lib.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex min-h-11 items-center text-[15px] text-shelf underline underline-offset-2"
        >
          지금 상태는 도서관 홈페이지에서 확인
        </a>
      ) : (
        <p className="mt-1 text-sm text-muted">지금 상태는 도서관에 물어보세요 (홈페이지 주소가 없어요)</p>
      )}
    </li>
  );
}

// 같은 시·도에서 이 책을 가진 다른 도서관. 펼칠 때만 불러온다 (API 호출을 아낌).
function OtherHolders({ isbn, mine }: { isbn: string; mine: Library[] }) {
  const [libs, setLibs] = useState<Library[] | "error" | null>(null);
  const regions = [...new Set(mine.map((l) => l.region))].filter(isSido);
  if (!regions.length) return null;

  async function load() {
    setLibs(null);
    try {
      const lists = await Promise.all(
        regions.map((r) =>
          fetch(`/api/holders?isbn=${isbn}&region=${r}`).then((res) =>
            res.ok ? (res.json() as Promise<{ libraries: Library[] }>) : Promise.reject(res.status),
          ),
        ),
      );
      const mineCodes = new Set(mine.map((l) => l.code));
      const near = new Set(mine.map((l) => sigunguOf(l.address)));
      const rank = (l: Library) => (near.has(sigunguOf(l.address)) ? 0 : 1);
      setLibs(
        lists
          .flatMap((d) => d.libraries)
          .filter((l) => !mineCodes.has(l.code))
          .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "ko")),
      );
    } catch {
      setLibs("error");
    }
  }

  function onToggle(e: SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open && (libs === null || libs === "error")) load();
  }

  return (
    <details onToggle={onToggle} className="group border-y border-line">
      {/* 사파리는 flex여도 기본 삼각형을 그려서 숨기고 직접 그린다 */}
      <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
        같은 지역에서 이 책을 가진 다른 도서관
        <span aria-hidden="true" className="shrink-0 text-2xl leading-none text-muted transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="pb-4">
        {libs === null ? (
          <p role="status" className="text-muted">찾는 중…</p>
        ) : libs === "error" ? (
          <p role="status" className="text-warn">목록을 받지 못했어요. 접었다가 다시 펼쳐 보세요.</p>
        ) : libs.length === 0 ? (
          <p role="status" className="text-muted">
            같은 시·도에 이 책을 가진 다른 도서관이 없어요. 소장 정보는 한 달에 한 번 갱신돼서 최근 들어온 책은 아직 안 보일 수 있어요.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {libs.map((l) => (
              <li key={l.code} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block">{l.name}</span>
                  <span className="block text-sm text-muted">{sigunguOf(l.address)}</span>
                </span>
                {l.homepage && (
                  <a
                    href={l.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center text-[15px] text-shelf underline underline-offset-2"
                  >
                    홈페이지
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-muted">이 목록은 소장만 보여 줘요. 대출 가능 여부는 각 도서관 홈페이지에서 확인하세요.</p>
      </div>
    </details>
  );
}

// 링크 복사. 내 도서관 중 이 책을 가진 곳이 있으면 그 한 곳을 링크에 넣는다 (미리보기 "이 책, ○○도서관에 있어요")
function ShareButton({ isbn, holder }: { isbn: string; holder: Library | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${location.origin}/book/${isbn}${holder ? `?lib=${holder.code}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("이 링크를 복사하세요", url);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={copy}
        className="flex h-12 w-full items-center justify-center rounded-md border border-ink/30 bg-white font-semibold"
      >
        {copied ? "링크를 복사했어요" : "링크 복사해서 공유하기"}
      </button>
      <p className="mt-1 text-sm text-muted" aria-live="polite">
        {holder ? `링크에 ${holder.name} 이름이 함께 담겨요. 나머지 도서관은 담기지 않아요.` : ""}
      </p>
    </div>
  );
}
