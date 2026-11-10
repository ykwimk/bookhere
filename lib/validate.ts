// 신뢰 경계 검사. 밖에서 들어온 값(경로·쿼리·localStorage)은 여기를 거친 뒤에만 API에 넘긴다.

/** 숫자 10자리 또는 13자리만 받는다. 10자리는 13자리로 바꿔 돌려준다 (정보나루는 isbn13을 쓴다). */
export function parseIsbn(s: string): string | null {
  if (/^\d{13}$/.test(s)) return s;
  if (!/^\d{10}$/.test(s)) return null;
  const core = '978' + s.slice(0, 9);
  const sum = [...core].reduce(
    (acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1),
    0,
  );
  return core + ((10 - (sum % 10)) % 10);
}

/** 정보나루 도서관 코드 (숫자, 자릿수는 추정이라 넉넉히 1~12자리). */
export const isLibCode = (s: string) => /^\d{1,12}$/.test(s);
