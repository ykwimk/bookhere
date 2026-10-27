import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { isMock } from "@/lib/data4library";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "책여기", template: "%s | 책여기" },
  description: "읽고 싶은 책이 내가 고른 도서관 3곳에 있는지, 어제 마감 때 빌릴 수 있었는지 한 화면에 보여 줍니다.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbfbf9" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col">
        {isMock && (
          <p className="bg-stamp px-4 py-2 text-center text-sm text-white">
            가짜 데이터로 보는 중이에요. 도서관과 소장 정보는 실제와 달라요.
          </p>
        )}
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-shelf">
              책여기
            </Link>
            <Link href="/libraries" className="inline-flex min-h-11 items-center px-2 text-[15px] text-muted hover:text-ink">
              내 도서관
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-line text-[13px] leading-relaxed text-muted">
          <div className="mx-auto max-w-xl space-y-0.5 px-4 py-6">
            <p>
              데이터 출처:{" "}
              <a href="https://www.data4library.kr" className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
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
