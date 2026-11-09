import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AskForm from '@/components/AskForm';
import { askOpen } from '@/lib/ask/guard';
import { PROMPT_VERSION } from '@/lib/llm';

export const metadata: Metadata = {
  title: '문장으로 찾기',
  description:
    '제목을 몰라도 어떤 책인지 한 문장으로 적으면, 도서관 정보나루에 있는 책 중에서 골라 드려요.',
};

export default function AskPage() {
  if (!askOpen(PROMPT_VERSION, process.env.VERCEL_ENV)) notFound();
  return (
    <>
      {PROMPT_VERSION === 'fake' && (
        <p className="bg-card text-muted -mx-5 -mt-6 mb-6 px-5 py-2 text-center text-[13px]">
          가짜 AI로 보는 중이에요
        </p>
      )}
      <AskForm />
    </>
  );
}
