'use client';

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from 'react';
import Form from 'next/form';
import { useRouter } from 'next/navigation';
import { SpinnerIcon } from './Icons';

// 홈 검색 폼. 같은 주소(/?q=)로 가서 loading.tsx 가 안 뜨므로, 누른 순간부터 새 결과가 그려질 때까지 버튼에서 기다림을 보여 준다.
// next/form 은 action 이 문자열이라 제출 때 router.push 만 불러서 useFormStatus 가 pending 을 받지 못한다
// (node_modules/next/dist/client/app-dir/form.js onFormSubmit) → 같은 이동을 transition 으로 감싸 그 상태를 쓴다.
// JS 가 없거나 하이드레이션 전에는 next/form 이 보통 GET 폼(action="/")으로 그대로 동작한다.
const Pending = createContext(false);

export default function SearchForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Pending value={pending}>
      <Form
        action="/"
        role="search"
        onSubmit={(e) => {
          e.preventDefault(); // next/form 은 이걸 보면 자기 이동을 건너뛴다
          if (pending) return;
          const q = String(new FormData(e.currentTarget).get('q') ?? '');
          startTransition(() => router.push(`/?${new URLSearchParams({ q })}`));
        }}
      >
        {children}
      </Form>
    </Pending>
  );
}

// "찾기". 글자는 투명하게만 해서 버튼 폭과 접근 이름("찾기")을 그대로 둔다. disabled 라 Enter 로도 두 번 안 보낸다.
export function SearchButton() {
  const pending = useContext(Pending);
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className="bg-accent hover:bg-accent-ink disabled:bg-accent-ink relative h-12 shrink-0 rounded-xl px-5 text-[16px] font-semibold text-white active:scale-[0.98]"
      >
        <span className={pending ? 'opacity-0' : undefined}>찾기</span>
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center">
            <SpinnerIcon className="size-5 motion-safe:animate-spin" />
          </span>
        )}
      </button>
      {/* 버튼 밖에 둔다: 버튼 안의 글은 화면 읽기가 알림으로 읽지 않는다 */}
      <span role="status" className="sr-only">
        {pending ? '찾는 중' : ''}
      </span>
    </>
  );
}
