import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import { isMock } from "@/lib/data4library";
import { SITE } from "@/lib/site";
import "./globals.css";

// 휴대폰마다 기본 한글 글꼴이 달라서 하나로 맞춘다 (빌드 때 받아 우리 주소에서 낸다)
const notoKr = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-noto-kr", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: SITE,
  title: { default: "책여기", template: "%s | 책여기" },
  description: "읽고 싶은 책이 내가 고른 도서관 3곳에 있는지, 어제 마감 때 빌릴 수 있었는지 한 화면에 보여 줍니다.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={notoKr.variable}>
      <body className="flex min-h-dvh flex-col">
        {isMock && (
          <p className="bg-card px-5 py-2 text-center text-[13px] text-muted">
            가짜 데이터로 보는 중이에요. 도서관과 소장 정보는 실제와 달라요.
          </p>
        )}
        <header>
          <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
            <Link href="/" className="inline-flex items-center gap-2 text-[18px] font-bold tracking-[-0.02em]">
              {/* 책갈피 모양 표시 */}
              <svg aria-hidden width="14" height="18" viewBox="0 0 16 20" className="fill-accent">
                <path d="M2 0h12a2 2 0 0 1 2 2v18l-8-5-8 5V2a2 2 0 0 1 2-2z" />
              </svg>
              책여기
            </Link>
            <Link href="/libraries" className="inline-flex min-h-11 items-center rounded-full px-3 text-[15px] font-medium hover:bg-card">
              내 도서관
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-xl flex-1 px-5 pt-6 pb-20">{children}</main>
        <footer className="bg-card text-[13px] leading-relaxed text-muted">
          <div className="mx-auto max-w-xl space-y-0.5 px-5 py-10">
            <p className="mb-2 text-[14px] font-bold text-ink">책여기</p>
            <p>
              데이터 출처:{" "}
              <a href="https://www.data4library.kr" className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noopener noreferrer">
                도서관 정보나루
              </a>{" "}
              (국립중앙도서관)
            </p>
            <p>대출 가능 여부는 어제 마감 기준이고, 소장 정보는 한 달에 한 번 갱신됩니다</p>
            <p>개인이 만든 서비스이며 도서관·국립중앙도서관의 공식 서비스가 아닙니다</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
