"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode, type SyntheticEvent } from "react";
import type { Library } from "@/lib/types";
import { loanBaseLabel } from "@/lib/date";
import { isSido, sigunguOf } from "@/lib/regions";
import { loadLibraries } from "@/lib/storage";
import { statusRank, summaryLine } from "@/lib/summary";
import { ArrowUpRightIcon, CalendarIcon, CheckIcon, HourglassIcon, MinusIcon, ShareIcon } from "./Icons";

type Result =
  | { code: string; ok: true; hasBook: boolean; loanAvailable: boolean; checkedAt: string }
  | { code: string; ok: false };

const primary =
  "flex h-12 w-full items-center justify-center rounded-xl bg-accent font-semibold text-white hover:bg-accent-ink active:scale-[0.98]";

// 화면 ③의 본문: 내 도서관(없으면 공유한 사람의 도서관)마다 소장·어제 기준 대출, 다른 소장 도서관, 공유 버튼
// head 는 책 정보 줄. 공유 아이콘이 결과(담을 도서관)를 알아야 해서 그 줄을 여기서 그린다.
export default function Availability({ isbn, shared, head }: { isbn: string; shared: Library | null; head: ReactNode }) {
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

  const top = (share: ReactNode) => (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{head}</div>
      {share}
    </div>
  );
  if (!mine) return top(<div className="size-11 shrink-0" />);

  const pickHref = `/libraries?from=${isbn}`;
  if (!targets.length) {
    return (
      <div className="space-y-8">
        {top(null)}
        <div className="rounded-[20px] bg-card p-5">
        <p className="text-[15px]">내 도서관을 고르면 이 책이 있는지, 어제 마감 때 빌릴 수 있었는지 바로 보여 드려요.</p>
          <Link href={pickHref} className={`mt-5 ${primary}`}>
            내 도서관 고르기
          </Link>
        </div>
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
  const summary =
    results && results !== "error"
      ? summaryLine(
          targets.map((l) => l.name),
          targets.map((l) => results[l.code]),
        )
      : null;
  const at = (l: Library) => (results === "error" ? "error" : results?.[l.code] ?? null);
  // 화면에서만 정렬 (저장된 순서는 그대로)
  const rows = [...targets].sort((a, b) => statusRank(at(a)) - statusRank(at(b)));
  const lead = "text-[20px] font-bold leading-[1.4] tracking-[-0.02em] text-balance";

  return (
    <div className="space-y-6">
      {top(<ShareButton isbn={isbn} holder={holder ?? null} />)}
      <section>
        {/* 공유 화면은 결론이 도서관 이름으로 나와서, 왜 이 도서관인지 알리는 한 줄을 남긴다 */}
        {!mine.length && <p className="mb-1 text-[14px] text-muted">공유한 분이 고른 도서관</p>}
        {/* 결론 한 줄: 불러오는 중이면 그렇다고만, 오류면 숨긴다 (아래 오류 상자가 설명) */}
        {results === null && <h2 className={`${lead} text-muted`}>도서관 {targets.length}곳 확인하는 중…</h2>}
        {summary && <h2 className={lead}>{summary.line}</h2>}
        {(summary?.note || ok[0]) && (
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
            {ok[0] && <CalendarIcon className="size-3.5" />}
            {ok[0] && `${loanBaseLabel(new Date(ok[0].checkedAt), true)} 마감 기준`}
            {summary?.note && ok[0] ? " · " : ""}
            {summary?.note}
          </p>
        )}

        {results === "error" && (
          <div role="status" className="mt-4 rounded-[20px] bg-warn-soft p-5 text-[15px] text-warn">
            <p>조회가 몰려 지금은 확인하지 못했어요. 잠시 뒤 다시 확인하거나 도서관 홈페이지에서 보세요.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-3 min-h-11 rounded-xl bg-paper px-4 font-bold text-ink hover:bg-card active:scale-[0.98]"
            >
              다시 확인
            </button>
          </div>
        )}

        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] bg-card" aria-busy={results === null}>
          {rows.map((l) => (
            <LibraryRow key={l.code} lib={l} result={at(l)} />
          ))}
        </ul>

        {noneHas && (
          <p className="mt-4 text-[14px] text-muted">
            고른 도서관에는 이 책이 없어요. 도서관에 희망도서 신청이나 상호대차(다른 도서관 책을 빌려오기)를 물어보세요.
          </p>
        )}
        {!mine.length && (
          <Link href={pickHref} className={`mt-4 ${primary}`}>
            내 도서관으로 보기
          </Link>
        )}
      </section>

      {mine.length > 0 && <OtherHolders isbn={isbn} mine={mine} />}
    </div>
  );
}

// 한 줄: 왼쪽 도서관 이름, 오른쪽 아이콘 + 짧은 상태. 아이콘만으로 구분하지 않고 글자를 함께 쓴다
function Status({ result }: { result: Result | "error" | null }) {
  const cls = "flex shrink-0 items-center gap-1 text-[14px]";
  if (result === null) return <span className={`${cls} text-muted`}>확인 중</span>;
  if (result === "error" || !result.ok) return <span className={`${cls} text-muted`}>확인 못 함</span>;
  if (!result.hasBook)
    return (
      <span className={`${cls} text-muted`}>
        <MinusIcon className="size-4 text-control" />
        없음
      </span>
    );
  return result.loanAvailable ? (
    <span className={`${cls} font-semibold text-accent-ink`}>
      <CheckIcon className="size-4 text-accent" />
      대출 가능
    </span>
  ) : (
    <span className={`${cls} font-medium`}>
      <HourglassIcon className="size-4 text-muted" />
      대출 중
    </span>
  );
}

function LibraryRow({ lib, result }: { lib: Library; result: Result | "error" | null }) {
  const row = "flex min-h-14 items-center gap-3 px-5 py-2.5";
  const inner = (
    <>
      <span className="min-w-0 flex-1 text-[16px] font-medium">{lib.name}</span>
      <Status result={result} />
    </>
  );
  return (
    <li>
      {lib.homepage ? (
        <a href={lib.homepage} target="_blank" rel="noopener noreferrer" className={`${row} hover:bg-raised/60`}>
          {inner}
          <ArrowUpRightIcon className="size-4 text-muted" />
          <span className="sr-only">새 탭에서 열림</span>
        </a>
      ) : (
        <div className={row}>{inner}</div>
      )}
      {result && result !== "error" && !result.ok && (
        <p className="-mt-1 px-5 pb-3 text-[13px] text-warn">
          정보나루에서 이 도서관 자료가 오지 않았어요. 폐관했거나 자료 수집이 멈췄을 수 있어요.{" "}
          <Link href="/libraries" className="underline underline-offset-2">
            도서관 바꾸기
          </Link>
        </p>
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
    <details onToggle={onToggle} className="group rounded-[20px] bg-card px-5">
      {/* 사파리는 flex여도 기본 삼각형을 그려서 숨기고 직접 그린다 */}
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        같은 지역 다른 도서관{Array.isArray(libs) ? ` ${libs.length}곳` : ""}
        <span aria-hidden="true" className="shrink-0 text-xl leading-none text-muted transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="pb-4 text-[15px]">
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
                  <span className="block text-[13px] text-muted">{sigunguOf(l.address)}</span>
                </span>
                {l.homepage && (
                  <a
                    href={l.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 shrink-0 items-center text-[14px] text-muted underline underline-offset-4 hover:text-accent"
                  >
                    홈페이지
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[13px] text-muted">이 목록은 소장만 보여 줘요. 대출 가능 여부는 각 도서관 홈페이지에서 확인하세요.</p>
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
    <>
      <button
        type="button"
        onClick={copy}
        aria-label="링크 복사해서 공유하기"
        className="-mr-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-card active:scale-95"
      >
        <ShareIcon className="size-5" />
      </button>
      {/* 복사 알림: 화면 아래에 잠깐 뜬다. 평소에는 비어 있는 읽기용 자리 */}
      <p
        role="status"
        className={
          copied
            ? "pointer-events-none fixed inset-x-5 bottom-6 z-10 mx-auto w-fit max-w-md rounded-full bg-ink px-4 py-2.5 text-center text-[14px] text-white"
            : "sr-only"
        }
      >
        {copied ? `링크를 복사했어요${holder ? ` · ${holder.name} 이름만 담겨요` : ""}` : ""}
      </p>
    </>
  );
}
