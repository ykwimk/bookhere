import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Finder from '@/components/Finder';
import { askOpen } from '@/lib/ask/guard';
import { PROMPT_VERSION } from '@/lib/llm';

export const metadata: Metadata = {
  title: '문장으로 찾기',
  description:
    '제목을 몰라도 어떤 책인지 한 문장으로 적으면, 도서관 정보나루에 있는 책 중에서 골라 드려요.',
};

// 홈과 같은 화면 (Finder). 닫혀 있으면 지금처럼 없는 주소
export default function AskPage() {
  if (
    !askOpen(PROMPT_VERSION, process.env.VERCEL_ENV, process.env.ASK_LAUNCHED)
  )
    notFound();
  return <Finder />;
}
