'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ask, loadLast, saveLast, type Shown } from '@/lib/ask/client';
import BookCover from './BookCover';
import { SpinnerIcon } from './Icons';
import Skeleton from './Skeleton';

// 문구 A·C: verifier 판정 글자 그대로 (사업팀 research/verified/2026-11-09-agenda17-약관.md). 고칠 때는 이 두 상수만.
// A 의 괄호는 LLM 이 Vercel AI Gateway 의 OpenAI 모델이라서 (대표 결정 2026-11-09). 서비스를 바꾸면 같이 고친다.
const NOTICE_A = [
  'AI(생성형 인공지능)가 적은 문장을 읽고, 도서관 정보나루에서 찾은 책 중 5권을 골라요.',
  '문장은 저장하지 않고 답을 만드는 데만 써요 (Vercel 을 거쳐 미국 OpenAI 로 전송, AI 학습에 쓰이지 않음). 이름·연락처 같은 개인정보는 적지 마세요.',
];
const NOTICE_C = [
  'AI 추천',
  ' · 이유는 AI가 쓴 글이에요. 틀릴 수 있으니 책 내용은 도서관에서 확인하세요.',
]; // 앞만 강조색

const MAX = 200;

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'failed' }
  | ({ status: 'done'; restored?: boolean } & Shown);

let booted = false; // 이 문서에서 처음 그리는지 (새로고침 판별)

export default function AskForm() {
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    // 새로고침은 뒤로·앞으로가 아니라 지운다. 처음 그릴 때만 본다 (책 화면에서 뒤로 와도 이 값은 그대로 남는다)
    const nav = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    if (!booted && nav?.type === 'reload' && nav.name === location.href)
      saveLast(history, null);
    booted = true;
    const last = loadLast(history);
    if (last) setState({ status: 'done', restored: true, ...last });
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sentence = text.trim();
    if (!sentence || state.status === 'loading') return;
    setState({ status: 'loading' });
    const shown = await ask(sentence, history);
    setState(shown ? { status: 'done', ...shown } : { status: 'failed' });
  }

  const loading = state.status === 'loading';
  const outcome =
    state.status === 'done'
      ? state.outcome
      : state.status === 'failed'
        ? 'error'
        : null;

  return (
    <div className="space-y-8">
      <form onSubmit={submit}>
        <h1 className="text-[24px] leading-[1.35] font-bold tracking-[-0.02em]">
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
          className="bg-card placeholder:text-muted hover:border-control mt-5 block w-full resize-none rounded-xl border border-transparent px-4 py-3 text-[16px] leading-relaxed"
        />
        <p className="text-muted mt-1 text-right text-[13px]">
          {MAX - text.length}자 남음
        </p>
        <div
          id="ask-notice"
          className="text-muted mt-1 space-y-1 text-[13px] leading-relaxed"
        >
          {NOTICE_A.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-ink disabled:bg-accent-ink relative mt-5 h-12 w-full rounded-xl px-5 text-[16px] font-semibold text-white active:scale-[0.98]"
        >
          <span className={loading ? 'opacity-0' : undefined}>찾기</span>
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
          {loading && (
            <p className="text-muted text-[14px]">
              AI가 책을 고르고 있어요. 몇 초 걸려요
            </p>
          )}
          {state.status === 'done' && state.restored && (
            <p className="mb-1 text-[14px] font-semibold">
              지난번에 찾은 책이에요
            </p>
          )}
          {outcome === 'ai' && (
            <p className="text-muted text-[14px]">
              <strong className="text-accent font-semibold">
                {NOTICE_C[0]}
              </strong>
              {NOTICE_C[1]}
            </p>
          )}
          {outcome === 'fallback' && state.status === 'done' && (
            <p className="text-muted text-[14px]">
              {state.keywords.length
                ? `추천을 만들지 못해 ‘${state.keywords.join(', ')}’(으)로 찾은 책이에요`
                : '추천을 만들지 못해 비슷한 조건으로 찾은 책이에요'}
            </p>
          )}
          {outcome === 'empty' && (
            <Message text="이 문장으로는 책을 못 찾았어요. 낱말을 바꾸거나 제목·저자로 찾아 보세요" />
          )}
          {outcome === 'capped' && (
            <Message text="오늘 문장 찾기를 다 썼어요. 내일 다시 쓰거나 제목·저자로 찾아 주세요" />
          )}
          {outcome === 'error' && (
            <Message
              warn
              text="지금 문장 찾기가 안 돼요. 잠시 뒤 다시 하거나 제목·저자로 찾아 주세요"
            />
          )}
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

        {state.status === 'done' && state.books.length > 0 && (
          <>
            <ul className="-mx-3 mt-4 space-y-1">
              {state.books.map((b) => (
                <li key={b.isbn13}>
                  <Link
                    href={`/book/${b.isbn13}`}
                    className="hover:bg-card flex gap-4 rounded-[20px] p-3 active:scale-[0.99]"
                  >
                    <BookCover src={b.cover} className="h-[92px] w-16" />
                    <div className="min-w-0 py-1">
                      <p className="text-[16px] leading-snug font-semibold">
                        {b.title}
                      </p>
                      <p className="text-muted mt-1 text-[14px]">{b.authors}</p>
                      <p className="text-muted text-[14px]">
                        {[b.publisher, b.year].filter(Boolean).join(', ')}
                      </p>
                      {state.outcome === 'ai' && b.reason && (
                        <p className="text-ink mt-1.5 text-[14px]">
                          {b.reason}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-muted mt-4 text-[13px]">자료: 도서관 정보나루</p>
          </>
        )}
      </section>
    </div>
  );
}

function Message({ text, warn = false }: { text: string; warn?: boolean }) {
  return (
    <div
      className={
        warn ? 'bg-warn-soft text-warn rounded-[20px] p-5' : 'text-muted'
      }
    >
      <p>{text}</p>
      <Link
        href="/"
        className="hover:text-ink mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
      >
        제목·저자로 찾기
      </Link>
    </div>
  );
}
