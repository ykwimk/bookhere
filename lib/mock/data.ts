// 가짜 데이터: 인증키 없이 화면을 보기 위한 것.
// 도서관 이름·코드·주소·소장 정보는 지어낸 것이고, 책 ISBN도 실제와 다를 수 있다.
import type { Book, Library } from "../types";

export const libraries: Library[] = [
  { code: "900001", name: "망원숲도서관", address: "서울특별시 마포구 망원로 1", homepage: "https://example.com/mangwon", region: "11" },
  { code: "900002", name: "합정책마루도서관", address: "서울특별시 마포구 양화로 2", homepage: "https://example.com/hapjeong", region: "11" },
  { code: "900003", name: "연희언덕도서관", address: "서울특별시 서대문구 연희로 3", homepage: "https://example.com/yeonhui", region: "11" },
  { code: "900004", name: "신촌별빛도서관", address: "서울특별시 서대문구 신촌로 4", homepage: "", region: "11" },
  { code: "900099", name: "(예시) 수집 중단 도서관", address: "서울특별시 마포구 예시로 99", homepage: "https://example.com/stopped", region: "11" },
  { code: "900005", name: "분당푸른도서관", address: "경기도 성남시 분당구 정자로 5", homepage: "https://example.com/bundang", region: "31" },
  { code: "900006", name: "판교새벽도서관", address: "경기도 성남시 분당구 판교로 6", homepage: "https://example.com/pangyo", region: "31" },
  { code: "900007", name: "수정마을도서관", address: "경기도 성남시 수정구 수정로 7", homepage: "https://example.com/sujeong", region: "31" },
];

/** 이 도서관은 bookExist가 늘 실패한다 (정보나루 수집 중단을 흉내 냄). */
export const BROKEN_LIB = "900099";

export const books: Book[] = [
  { isbn13: "9788936434120", title: "소년이 온다", authors: "한강 지음", publisher: "창비", year: "2014", cover: "" },
  { isbn13: "9788954682152", title: "작별하지 않는다", authors: "한강 지음", publisher: "문학동네", year: "2021", cover: "" },
  // 같은 책의 다른 판 (ISBN이 다르다)
  { isbn13: "9788936433598", title: "채식주의자", authors: "한강 지음", publisher: "창비", year: "2007", cover: "" },
  { isbn13: "9788936434595", title: "채식주의자 (리마스터판)", authors: "한강 지음", publisher: "창비", year: "2022", cover: "" },
];

/** 도서관 코드 → { ISBN13: 어제 마감 때 대출 가능했나 }. 목록에 없으면 소장 안 함. */
export const holdings: Record<string, Record<string, boolean>> = {
  "900001": { "9788936434120": false, "9788954682152": true },
  "900002": { "9788936434120": true },
  "900003": { "9788936434120": true, "9788936434595": false },
  "900004": { "9788954682152": false },
  "900005": { "9788936434120": false, "9788936433598": true },
  "900006": { "9788954682152": true },
  "900007": { "9788936434120": true },
};
