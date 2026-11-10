// 공유 미리보기 이미지. /og/<isbn> 또는 /og/<isbn>/<도서관 코드>
// verifier 조건 5: 경로 값은 숫자인지 검사만 하고, 이미지 글자는 서버가 API에서 받은 값만 쓴다 (쿼리 문자열은 읽지 않음).
import { ImageResponse } from 'next/og';
import { bookExist, getBook, getLibrary } from '@/lib/data4library';
import { isLibCode, parseIsbn } from '@/lib/validate';

// next/og 기본 글꼴에는 한글이 없다 → 필요한 글자만 Google Fonts에서 받는다 (서버에서, 7일 캐시)
async function koreanFont(text: string): Promise<ArrayBuffer | null> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`,
    { next: { revalidate: 7 * 86400 } },
  ).then((r) => r.text());
  const src = css.match(
    /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
  )?.[1];
  return src
    ? fetch(src, { next: { revalidate: 7 * 86400 } }).then((r) =>
        r.arrayBuffer(),
      )
    : null;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ isbn: string; lib?: string[] }> },
) {
  const { isbn: rawIsbn, lib = [] } = await ctx.params;
  const isbn = parseIsbn(rawIsbn);
  const code = lib[0];
  if (!isbn || lib.length > 1 || (code !== undefined && !isLibCode(code))) {
    return new Response(null, { status: 400 });
  }

  const [book, library] = await Promise.all([
    getBook(isbn).catch(() => null),
    code ? getLibrary(code).catch(() => null) : null,
  ]);
  // 한도 보호: 도서관 목록에 있는 코드일 때만 소장을 묻는다
  const has = library
    ? await bookExist(library.code, isbn).catch(() => null)
    : null;
  const headline =
    has?.hasBook && library
      ? `이 책, ${library.name}에 있어요`
      : '이 책, 내 도서관에 있을까요?';
  const title = (book?.title ?? '').slice(0, 60);
  const foot = '대출 가능 여부는 어제 마감 기준, 자료 출처 도서관 정보나루';
  const font = await koreanFont(`책여기${headline}${title}${foot}`).catch(
    () => null,
  );

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#ffffff',
        color: '#1b1d1f',
        fontFamily: font ? 'NotoSansKR' : undefined,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 36 }}
      >
        {/* 작은 초록 책갈피 표시 (화면 머리의 것과 같은 모양) */}
        <svg width="28" height="36" viewBox="0 0 16 20">
          <path
            d="M2 0h12a2 2 0 0 1 2 2v18l-8-5-8 5V2a2 2 0 0 1 2-2z"
            fill="#2f7d55"
          />
        </svg>
        책여기
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{ fontSize: 68, lineHeight: 1.25, letterSpacing: '-0.02em' }}
        >
          {headline}
        </div>
        {title ? (
          <div style={{ fontSize: 40, color: '#5c6064', marginTop: 24 }}>
            {title}
          </div>
        ) : null}
      </div>
      <div style={{ fontSize: 26, color: '#5c6064' }}>{foot}</div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: font
        ? [{ name: 'NotoSansKR', data: font, weight: 700, style: 'normal' }]
        : undefined,
      // 기본값은 1년 캐시다. 소장 상태가 바뀌므로 하루로 줄인다
      headers: { 'cache-control': 'public, max-age=86400' },
    },
  );
}
