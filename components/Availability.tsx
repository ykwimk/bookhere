'use client';

import {
  useEffect,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import Link from 'next/link';
import { loanBaseLabel } from '@/lib/date';
import { isSido, sigunguOf } from '@/lib/regions';
import { useLibraries } from '@/lib/useLibraries';
import { statusRank, summaryLine } from '@/lib/summary';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  HourglassIcon,
  MinusIcon,
  ShareIcon,
} from './Icons';
import Skeleton, {
  BadgeSkeleton,
  ResultsSkeleton,
  SummarySkeleton,
} from './Skeleton';
import type { Library } from '@/lib/types';

type Result =
  | {
      code: string;
      ok: true;
      hasBook: boolean;
      loanAvailable: boolean;
      checkedAt: string;
    }
  | { code: string; ok: false; missing?: boolean };

// 주 행동은 먹색 사각 하나 (DESIGN.md Ink Action). 휴대폰은 전체 폭, PC 는 글 폭
const primary =
  'flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-9 text-[16px] font-bold text-white hover:bg-black active:scale-[0.98] lg:w-fit';

// 화면 ③의 본문: 내 도서관(없으면 공유한 사람의 도서관)마다 소장·어제 기준 대출, 다른 소장 도서관, 공유 버튼
// head 는 책 정보 줄. 공유 아이콘이 결과(담을 도서관)를 알아야 해서 그 줄을 여기서 그린다.
export default function Availability({
  isbn,
  shared,
  head,
}: {
  isbn: string;
  shared: Library | null;
  head: ReactNode;
}) {
  const mine = useLibraries();
  const [fetched, setFetched] = useState<{
    key: string;
    results: Record<string, Result> | 'error';
  }>();
  const [attempt, setAttempt] = useState(0);

  const targets = mine?.length ? mine : shared ? [shared] : [];
  const codes = targets.map((l) => l.code).join(',');
  const regions = [...new Set(targets.map((l) => l.region))]
    .filter(isSido)
    .join(',');
  // 지금 요청의 답만 쓴다. 책·도서관이 바뀌거나 다시 확인하면 새 답이 올 때까지 null (불러오는 중)
  const key = `${isbn}|${codes}|${regions}|${attempt}`;
  const results = fetched?.key === key ? fetched.results : null;

  useEffect(() => {
    if (!codes) return;
    const ctrl = new AbortController();
    fetch(`/api/availability?isbn=${isbn}&libs=${codes}&regions=${regions}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { results: Result[] }) =>
        setFetched({
          key,
          results: Object.fromEntries(d.results.map((x) => [x.code, x])),
        }),
      )
      .catch(() => {
        if (!ctrl.signal.aborted) setFetched({ key, results: 'error' });
      });
    return () => ctrl.abort();
  }, [key, isbn, codes, regions]);

  const top = (share: ReactNode) => (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{head}</div>
      {share}
    </div>
  );
  // 내 도서관을 읽기 전 (첫 그림·하이드레이션 전): loading.tsx 와 같은 뼈대를 두어 화면이 줄었다 늘지 않게
  if (!mine)
    return (
      <div className="space-y-8">
        {top(<div className="size-11 shrink-0" />)}
        <ResultsSkeleton />
      </div>
    );

  const pickHref = `/libraries?from=${isbn}`;
  if (!targets.length) {
    return (
      <div className="space-y-8">
        {top(null)}
        <div>
          <p className="text-ink-2 text-[15px]">
            내 도서관을 고르면 이 책이 있는지, 어제 마감 때 빌릴 수 있었는지
            바로 보여 드려요.
          </p>
          <Link href={pickHref} className={`mt-5 ${primary}`}>
            내 도서관 고르기
          </Link>
        </div>
      </div>
    );
  }

  const ok =
    results && results !== 'error'
      ? Object.values(results).filter(
          (r): r is Extract<Result, { ok: true }> => r.ok,
        )
      : [];
  const holder = targets.find((l) => {
    const r = results && results !== 'error' ? results[l.code] : undefined;
    return r?.ok && r.hasBook;
  });
  const noneHas = ok.length === targets.length && !holder;
  const summary =
    results && results !== 'error'
      ? summaryLine(
          targets.map((l) => l.name),
          targets.map((l) => results[l.code]),
        )
      : null;
  const at = (l: Library) =>
    results === 'error' ? 'error' : (results?.[l.code] ?? null);
  // 화면에서만 정렬 (저장된 순서는 그대로)
  const rows = [...targets].sort(
    (a, b) => statusRank(at(a)) - statusRank(at(b)),
  );
  const lead =
    'text-[20px] font-extrabold leading-[1.4] tracking-[-0.03em] text-balance';

  return (
    <div className="space-y-8">
      {top(<ShareButton isbn={isbn} holder={holder ?? null} />)}
      <section>
        {/* 공유 화면은 결론이 도서관 이름으로 나와서, 왜 이 도서관인지 알리는 한 줄을 남긴다 */}
        {!mine.length && (
          <p className="text-muted mb-1 text-[14px]">공유한 분이 고른 도서관</p>
        )}
        {/* 결론 한 줄: 불러오는 중이면 뼈대(글은 화면 읽기에만), 오류면 숨긴다 (아래 오류 상자가 설명) */}
        {results === null && (
          <>
            <h2 className="sr-only">도서관 {targets.length}곳 확인하는 중…</h2>
            <SummarySkeleton />
          </>
        )}
        {summary && <h2 className={lead}>{summary.line}</h2>}
        {(summary?.note || ok[0]) && (
          <p className="text-muted mt-1 flex items-center gap-1.5 text-[13px]">
            {ok[0] && <CalendarIcon className="size-3.5" />}
            {ok[0] &&
              `${loanBaseLabel(new Date(ok[0].checkedAt), true)} 마감 기준`}
            {summary?.note && ok[0] ? ' · ' : ''}
            {summary?.note}
          </p>
        )}

        {/* 요청 실패, 또는 고른 곳 모두 정보나루 조회 실패(한도 초과 등, 목록에 없음은 제외) */}
        {(results === 'error' ||
          (results &&
            !ok.length &&
            Object.values(results).some((r) => !r.ok && !r.missing))) && (
          <div
            role="status"
            className="text-warn border-warn mt-4 border-t pt-4 text-[15px]"
          >
            <p>
              조회가 몰려 지금은 확인하지 못했어요. 잠시 뒤 다시 확인하거나
              도서관 홈페이지에서 보세요.
            </p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="text-ink mt-2 inline-flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4"
            >
              다시 확인
            </button>
          </div>
        )}

        <ul className="mt-4" aria-busy={results === null}>
          {rows.map((l) => (
            <LibraryRow key={l.code} lib={l} result={at(l)} />
          ))}
        </ul>

        {noneHas && (
          <p className="text-muted mt-4 text-[14px]">
            고른 도서관에는 이 책이 없어요. 도서관에 희망도서 신청이나
            상호대차(다른 도서관 책을 빌려오기)를 물어보세요.
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
// 대출 가능·대출 중은 알약으로 감싸 눈에 띄게, 없음은 글자만 (대표 요청)
// 초록은 "빌릴 수 있다" 는 상태에만 남긴다 (버튼은 먹색). 대출 중은 바탕이 흰 종이라 알약 회색으로
function Status({ result }: { result: Result | 'error' | null }) {
  const cls = 'flex shrink-0 items-center gap-1 text-[14px]';
  const pill = `${cls} rounded-full px-3 py-1.5`;
  if (result === null)
    return (
      <span className="shrink-0">
        <BadgeSkeleton />
        <span className="sr-only">확인 중</span>
      </span>
    );
  if (result === 'error' || !result.ok)
    return <span className={`${cls} text-muted`}>확인 못 함</span>;
  if (!result.hasBook)
    return (
      <span className={`${cls} text-muted`}>
        <MinusIcon className="text-control size-4" />
        없음
      </span>
    );
  return result.loanAvailable ? (
    <span className={`${pill} bg-accent-soft text-accent-ink font-semibold`}>
      <CheckIcon className="text-accent size-4" />
      대출 가능
    </span>
  ) : (
    <span className={`${pill} bg-card font-medium`}>
      <HourglassIcon className="text-muted size-4" />
      대출 중
    </span>
  );
}

function LibraryRow({
  lib,
  result,
}: {
  lib: Library;
  result: Result | 'error' | null;
}) {
  const row = 'flex min-h-14 items-center gap-3 py-2.5';
  const inner = (
    <>
      <span className="min-w-0 flex-1 text-[16px] font-medium group-hover:underline group-hover:underline-offset-4">
        {lib.name}
      </span>
      <Status result={result} />
    </>
  );
  return (
    <li className="border-line border-t">
      {lib.homepage ? (
        <a
          href={lib.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className={`group ${row}`}
        >
          {inner}
          <ArrowUpRightIcon className="text-muted size-4" />
          <span className="sr-only">새 탭에서 열림</span>
        </a>
      ) : (
        <div className={row}>{inner}</div>
      )}
      {result && result !== 'error' && !result.ok && result.missing && (
        <p className="text-warn -mt-1 pb-3 text-[13px]">
          정보나루에서 이 도서관 자료가 오지 않았어요. 폐관했거나 자료 수집이
          멈췄을 수 있어요.{' '}
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
  const [libs, setLibs] = useState<Library[] | 'error' | null>(null);
  const regions = [...new Set(mine.map((l) => l.region))].filter(isSido);
  if (!regions.length) return null;

  async function load() {
    setLibs(null);
    try {
      const lists = await Promise.all(
        regions.map((r) =>
          fetch(`/api/holders?isbn=${isbn}&region=${r}`).then((res) =>
            res.ok
              ? (res.json() as Promise<{ libraries: Library[] }>)
              : Promise.reject(res.status),
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
          .sort(
            (a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'ko'),
          ),
      );
    } catch {
      setLibs('error');
    }
  }

  function onToggle(e: SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open && (libs === null || libs === 'error')) load();
  }

  return (
    <details onToggle={onToggle} className="group border-line border-t">
      {/* 사파리는 flex여도 기본 삼각형을 그려서 숨기고 직접 그린다 */}
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 text-[15px] font-extrabold [&::-webkit-details-marker]:hidden">
        같은 지역 다른 도서관{Array.isArray(libs) ? ` ${libs.length}곳` : ''}
        <ChevronDownIcon className="text-muted size-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-[15px]">
        {libs === null ? (
          <>
            <p role="status" className="sr-only">
              찾는 중…
            </p>
            {/* 아래 목록 줄(이름 15px + 시·군·구 13px, py-2)과 같은 높이 */}
            <ul aria-hidden className="divide-line divide-y">
              {['w-36', 'w-28'].map((w) => (
                <li key={w} className="py-2">
                  <Skeleton className={`my-1 h-4 rounded ${w}`} />
                  <Skeleton className="my-1 h-3 w-14 rounded" />
                </li>
              ))}
            </ul>
          </>
        ) : libs === 'error' ? (
          <p role="status" className="text-warn">
            목록을 받지 못했어요. 접었다가 다시 펼쳐 보세요.
          </p>
        ) : libs.length === 0 ? (
          <p role="status" className="text-muted">
            같은 시·도에 이 책을 가진 다른 도서관이 없어요. 소장 정보는 한 달에
            한 번 갱신돼서 최근 들어온 책은 아직 안 보일 수 있어요.
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {libs.map((l) => (
              <li
                key={l.code}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block">{l.name}</span>
                  <span className="text-muted block text-[13px]">
                    {sigunguOf(l.address)}
                  </span>
                </span>
                {l.homepage && (
                  <a
                    href={l.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-ink inline-flex min-h-11 shrink-0 items-center text-[14px] underline underline-offset-4"
                  >
                    홈페이지
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted mt-2 text-[13px]">
          이 목록은 소장만 보여 줘요. 대출 가능 여부는 각 도서관 홈페이지에서
          확인하세요.
        </p>
      </div>
    </details>
  );
}

// 링크 복사. 내 도서관 중 이 책을 가진 곳이 있으면 그 한 곳을 링크에 넣는다 (미리보기 "이 책, ○○도서관에 있어요")
function ShareButton({
  isbn,
  holder,
}: {
  isbn: string;
  holder: Library | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${location.origin}/book/${isbn}${holder ? `?lib=${holder.code}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('이 링크를 복사하세요', url);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label="링크 복사해서 공유하기"
        className="text-ink hover:bg-card -mr-2.5 flex size-11 shrink-0 items-center justify-center rounded-full active:scale-95"
      >
        <ShareIcon className="size-5" />
      </button>
      {/* 복사 알림: 화면 아래에 잠깐 뜬다. 평소에는 비어 있는 읽기용 자리 */}
      <p
        role="status"
        className={
          copied
            ? 'bg-ink pointer-events-none fixed inset-x-5 bottom-6 z-10 mx-auto w-fit max-w-md rounded-full px-4 py-2.5 text-center text-[14px] text-white'
            : 'sr-only'
        }
      >
        {copied
          ? `링크를 복사했어요${holder ? ` · ${holder.name} 이름만 담겨요` : ''}`
          : ''}
      </p>
    </>
  );
}
