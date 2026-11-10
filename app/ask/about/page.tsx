import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { askOpen } from '@/lib/ask/guard';
import { PROMPT_VERSION } from '@/lib/llm';

// 문구 B: verifier 판정 글자 그대로 (사업팀 research/verified/2026-11-10-agenda17-openai-vercel-약관.md "B. 고친 판").
// ④ 는 Vercel Model Training 을 끄기 전 판 (Vercel 학습 언급 없음). LLM 서비스를 바꾸면 AskForm 문구 A 와 같이 고친다.
export const metadata: Metadata = {
  title: '이용 안내 · 개인정보 처리 안내',
  description:
    '문장으로 찾기에 적은 문장을 어디로 보내고 얼마나 두는지 알려 드려요.',
};

const TRANSFER = [
  ['① 항목', '문장으로 찾기에 적은 문장 (그 안에 적은 정보 포함)'],
  [
    '② 국가·시기·방법',
    '미국 (Vercel은 다른 나라 거점을 거칠 수 있음), 찾기 버튼을 누를 때마다, 암호화 통신(HTTPS)',
  ],
  [
    '③ 받는 자',
    'Vercel Inc.(privacy@vercel.com)를 거쳐 OpenAI OpCo, LLC(dsar@openai.com)',
  ],
  [
    '④ 목적·보유',
    '추천 만들기. 책여기는 저장하지 않고, Vercel은 요청이 끝나면 바로 지우며, OpenAI는 학습에 쓰지 않고 오남용 확인 기록을 최대 30일 보관한 뒤 지웁니다.',
  ],
  ['⑤ 거부', '문장으로 찾기 대신 제목·저자로 찾으면 보내지 않습니다.'],
];

export default function AskAboutPage() {
  if (
    !askOpen(PROMPT_VERSION, process.env.VERCEL_ENV, process.env.ASK_LAUNCHED)
  )
    notFound();
  return (
    <article className="text-[14px] leading-relaxed">
      <h1 className="text-[20px] leading-[1.35] font-bold tracking-[-0.02em] text-balance">
        이용 안내 · 개인정보 처리 안내
      </h1>

      <h2 className="mt-8 text-[16px] font-bold">이용 안내</h2>
      <ul className="text-muted mt-2 list-disc space-y-1 pl-5">
        <li>문장으로 찾기의 결과와 이유는 AI가 만든 것이라 틀릴 수 있어요.</li>
        <li>만 18세 미만은 보호자 동의를 받고 이용해 주세요.</li>
      </ul>

      <h2 className="mt-8 text-[16px] font-bold">개인정보 처리 안내</h2>
      <p className="text-muted mt-2">
        책여기는 회원가입·로그인이 없고, 문장으로 찾기에 적은 문장을 저장하지
        않습니다.
      </p>
      <h3 className="mt-5 font-semibold">국외 이전</h3>
      <dl className="mt-2 space-y-3">
        {TRANSFER.map(([term, desc]) => (
          <div key={term}>
            <dt className="font-medium">{term}</dt>
            <dd className="text-muted break-words">{desc}</dd>
          </div>
        ))}
      </dl>

      <p className="text-muted mt-8">
        저장하는 문장이 없어 열람·삭제할 기록은 없어요. 문의:{' '}
        <a
          href="mailto:ykwimk@gmail.com"
          className="hover:text-ink underline underline-offset-2"
        >
          ykwimk@gmail.com
        </a>
      </p>
    </article>
  );
}
