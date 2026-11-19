import type { ReactNode } from 'react';
import { askOpen } from '@/lib/ask/guard';
import { PROMPT_VERSION } from '@/lib/llm';
import AskForm from './AskForm';
import { SearchIcon } from './Icons';
import MyLibraries from './MyLibraries';
import SearchForm, { SearchButton } from './SearchForm';

// 홈과 /ask 가 같이 쓰는 화면. 문장으로 찾기가 맨 위·큰 칸, 제목 검색은 옆 칸(휴대폰은 아래)의 알약.
// 문장으로 찾기가 닫히면 (askOpen) 예전처럼 제목 검색만 한 기둥으로 보인다
export default function Finder({
  q = '',
  children,
}: {
  q?: string;
  children?: ReactNode;
}) {
  const open = askOpen(
    PROMPT_VERSION,
    process.env.VERCEL_ENV,
    process.env.ASK_LAUNCHED,
  );

  const title = (
    <SearchForm>
      {open ? (
        <label htmlFor="q" className="text-[15px] font-extrabold">
          제목으로 찾기
        </label>
      ) : (
        <h1 className="text-[26px] leading-[1.3] font-extrabold tracking-[-0.03em] text-balance">
          <label htmlFor="q">읽고 싶은 책, 내 도서관에 있을까</label>
        </h1>
      )}
      <div className="bg-card focus-within:outline-ink mt-2.5 flex h-12 items-center rounded-full pr-1 pl-4 focus-within:outline-2 focus-within:outline-offset-2">
        <SearchIcon className="text-muted size-[18px]" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="제목, 저자, ISBN"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={100}
          required
          className="placeholder:text-hint h-full min-w-0 flex-1 bg-transparent px-2.5 text-[16px] font-medium focus-visible:outline-none"
        />
        <SearchButton />
      </div>
    </SearchForm>
  );

  if (!open) {
    return (
      <div className="space-y-10">
        {title}
        <MyLibraries />
        {children}
      </div>
    );
  }

  return (
    <>
      {PROMPT_VERSION === 'fake' && (
        <p className="bg-card text-muted -mx-5 -mt-6 mb-6 px-5 py-2 text-center text-[13px]">
          가짜 AI로 보는 중이에요
        </p>
      )}
      <div className="finder cols">
        <AskForm />
        <div className="cols-side">
          <div className="finder-title border-line mt-12 border-t pt-8 lg:mt-0 lg:border-t-0 lg:pt-0">
            {title}
          </div>
          <div className="finder-libs mt-12 lg:mt-10">
            <MyLibraries />
          </div>
        </div>
        {children && (
          <div className="mt-10 [grid-area:results] lg:mt-14">{children}</div>
        )}
      </div>
    </>
  );
}
