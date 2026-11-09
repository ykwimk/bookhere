"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import BookCover from "./BookCover";
import { SpinnerIcon } from "./Icons";
import Skeleton from "./Skeleton";
import type { AskBook, AskResponse } from "@/lib/ask/types";
import { safeUrl } from "@/lib/parse";

// 문구 A·C: verifier 판정 글자 그대로 (사업팀 research/verified/2026-11-09-agenda17-약관.md). 고칠 때는 이 두 상수만.
// A 의 "(미국 Anthropic 으로 전송 …)" 은 LLM 서비스가 정해지면 팀장이 고친다.
const NOTICE_A = [
  "AI(생성형 인공지능)가 적은 문장을 읽고, 도서관 정보나루에서 찾은 책 중 5권을 골라요.",
  "문장은 저장하지 않고 답을 만드는 데만 써요 (미국 Anthropic 으로 전송, AI 학습에 쓰이지 않음). 이름·연락처 같은 개인정보는 적지 마세요.",
];
const NOTICE_C = ["AI 추천", " · 이유는 AI가 쓴 글이에요. 틀릴 수 있으니 책 내용은 도서관에서 확인하세요."]; // 앞만 강조색

const MAX = 200;
// 마지막 결과 (책·이유만, 문장은 빼고). 책 화면에서 돌아오면 다시 그려서 같은 문장으로 LLM 을 또 부르지 않는다
const LAST = "bookhere:ask:last:v1";

type Shown = { outcome: AskResponse["outcome"]; books: AskBook[]; keywords: string[] };
type State = { status: "idle" } | { status: "loading" } | { status: "failed" } | ({ status: "done" } & Shown);

const s = (v: unknown) => (typeof v === "string" ? v : "");

/** 서버 응답·sessionStorage 값은 밖에서 온 값으로 본다. */
function readShown(v: unknown): Shown | null {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  if (!["ai", "fallback", "empty", "capped", "error"].includes(s(o.outcome))) return null;
  const books = (Array.isArray(o.books) ? o.books : [])
    .filter((b) => /^\d{13}$/.test(s(b?.isbn13)) && s(b.title))
    .map((b) => ({
      isbn13: s(b.isbn13),
      title: s(b.title),
      authors: s(b.authors),
      publisher: s(b.publisher),
      year: s(b.year),
      cover: safeUrl(b.cover),
      reason: s(b.reason) || undefined,
    }));
  const keywords = (Array.isArray(o.keywords) ? o.keywords : []).map(s).filter(Boolean);
  return { outcome: o.outcome as Shown["outcome"], books, keywords };
}

export default function AskForm() {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    try {
      const last = readShown(JSON.parse(sessionStorage.getItem(LAST) ?? "null"));
      if (last?.books.length) setState({ status: "done", ...last });
    } catch {}
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sentence = text.trim();
    if (!sentence || state.status === "loading") return;
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence }),
      }); // 기다림 상한은 서버 마감 8초. AbortSignal.timeout 은 옛 사파리(16 미만)에 없어서 쓰지 않는다
      const shown = res.ok ? readShown(await res.json()) : null;
      if (!shown) return setState({ status: "failed" });
      setState({ status: "done", ...shown });
      try {
        if (shown.books.length) sessionStorage.setItem(LAST, JSON.stringify(shown));
        else sessionStorage.removeItem(LAST);
      } catch {}
    } catch {
      setState({ status: "failed" });
    }
  }

  const loading = state.status === "loading";
  const outcome = state.status === "done" ? state.outcome : state.status === "failed" ? "error" : null;

  return (
    <div className="space-y-8">
      <form onSubmit={submit}>
        <h1 className="text-[24px] font-bold leading-[1.35] tracking-[-0.02em]">
          <label htmlFor="sentence">어떤 책을 찾나요?</label>
        </h1>
        <textarea
          id="sentence"
          name="sentence"
          rows={3}
          maxLength={MAX}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="초등 2학년 아이랑 읽을 공룡 그림책"
          autoComplete="off"
          aria-describedby="ask-notice"
          className="mt-5 block w-full resize-none rounded-xl border border-transparent bg-card px-4 py-3 text-[16px] leading-relaxed placeholder:text-muted hover:border-control"
        />
        <p className="mt-1 text-right text-[13px] text-muted">{MAX - text.length}자 남음</p>
        <div id="ask-notice" className="mt-1 space-y-1 text-[13px] leading-relaxed text-muted">
          {NOTICE_A.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="relative mt-5 h-12 w-full rounded-xl bg-accent px-5 text-[16px] font-semibold text-white hover:bg-accent-ink active:scale-[0.98] disabled:bg-accent-ink"
        >
          <span className={loading ? "opacity-0" : undefined}>찾기</span>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <SpinnerIcon className="size-5 motion-safe:animate-spin" />
            </span>
          )}
        </button>
      </form>

      <section aria-label="찾은 책">
        {/* 늘 그려 둔다: 내용이 바뀔 때 화면 읽기가 읽는다 */}
        <div role="status">
          {loading && <p className="text-[14px] text-muted">AI가 책을 고르고 있어요. 몇 초 걸려요</p>}
          {outcome === "ai" && (
            <p className="text-[14px] text-muted">
              <strong className="font-semibold text-accent">{NOTICE_C[0]}</strong>
              {NOTICE_C[1]}
            </p>
          )}
          {outcome === "fallback" && state.status === "done" && (
            <p className="text-[14px] text-muted">
              {state.keywords.length
                ? `추천을 만들지 못해 ‘${state.keywords.join(", ")}’(으)로 찾은 책이에요`
                : "추천을 만들지 못해 비슷한 조건으로 찾은 책이에요"}
            </p>
          )}
          {outcome === "empty" && <Message text="이 문장으로는 책을 못 찾았어요. 낱말을 바꾸거나 제목·저자로 찾아 보세요" />}
          {outcome === "capped" && <Message text="오늘 문장 찾기를 다 썼어요. 내일 다시 쓰거나 제목·저자로 찾아 주세요" />}
          {outcome === "error" && <Message warn text="지금 문장 찾기가 안 돼요. 잠시 뒤 다시 하거나 제목·저자로 찾아 주세요" />}
        </div>

        {loading && (
          <ul aria-hidden className="-mx-3 mt-4 space-y-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex gap-4 p-3">
                <Skeleton className="h-[92px] w-16 rounded-[4px]" />
                <div className="flex-1 py-1">
                  <Skeleton className="h-5 w-3/5 rounded-md" />
                  <Skeleton className="mt-2 h-4 w-2/5 rounded" />
                  <Skeleton className="mt-1.5 h-4 w-1/3 rounded" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {state.status === "done" && state.books.length > 0 && (
          <>
            <ul className="-mx-3 mt-4 space-y-1">
              {state.books.map((b) => (
                <li key={b.isbn13}>
                  <Link href={`/book/${b.isbn13}`} className="flex gap-4 rounded-[20px] p-3 hover:bg-card active:scale-[0.99]">
                    <BookCover src={b.cover} className="h-[92px] w-16" />
                    <div className="min-w-0 py-1">
                      <p className="text-[16px] font-semibold leading-snug">{b.title}</p>
                      <p className="mt-1 text-[14px] text-muted">{b.authors}</p>
                      <p className="text-[14px] text-muted">{[b.publisher, b.year].filter(Boolean).join(", ")}</p>
                      {state.outcome === "ai" && b.reason && <p className="mt-1.5 text-[14px] text-ink">{b.reason}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-muted">자료: 도서관 정보나루</p>
          </>
        )}
      </section>
    </div>
  );
}

function Message({ text, warn = false }: { text: string; warn?: boolean }) {
  return (
    <div className={warn ? "rounded-[20px] bg-warn-soft p-5 text-warn" : "text-muted"}>
      <p>{text}</p>
      <Link href="/" className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4 hover:text-ink">
        제목·저자로 찾기
      </Link>
    </div>
  );
}
