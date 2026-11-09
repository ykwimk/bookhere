import type { Metadata } from "next";
import AskForm from "@/components/AskForm";
import { PROMPT_VERSION } from "@/lib/llm";

export const metadata: Metadata = {
  title: "문장으로 찾기",
  description: "제목을 몰라도 어떤 책인지 한 문장으로 적으면, 도서관 정보나루에 있는 책 중에서 골라 드려요.",
};

export default function AskPage() {
  return (
    <>
      {PROMPT_VERSION === "fake" && (
        <p className="-mx-5 -mt-6 mb-6 bg-card px-5 py-2 text-center text-[13px] text-muted">가짜 AI로 보는 중이에요</p>
      )}
      <AskForm />
    </>
  );
}
