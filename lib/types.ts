export type Library = {
  code: string;
  name: string;
  address: string;
  homepage: string; // http(s) 주소만, 없으면 ""
  region: string; // 시·도 코드 (lib/regions.ts), 모르면 ""
};

export type Book = {
  isbn13: string;
  title: string;
  authors: string;
  publisher: string;
  year: string;
  cover: string; // http(s) 주소만, 없으면 ""
};

export type Availability = {
  hasBook: boolean;
  loanAvailable: boolean; // 전일(어제 마감) 기준
  checkedAt: string; // 정보나루가 응답한 시각 (ISO). "어제"는 이 시각의 전날
};
