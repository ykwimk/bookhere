// 실행: npm test (Node 24의 TypeScript 지우기 기능으로 돈다. 패키지 설치 없이도 `node --test "test/**/*.test.ts"` 로 된다)
import { test } from "node:test";
import assert from "node:assert/strict";
import { isLibCode, parseIsbn } from "../lib/validate.ts";
import { parseBookExist, parseBooks, parseLibraries, safeUrl } from "../lib/parse.ts";
import { loanBaseLabel } from "../lib/date.ts";
import { sidoOf, sigunguOf } from "../lib/regions.ts";

test("ISBN: 숫자 13자리는 그대로, 10자리는 13자리로", () => {
  assert.equal(parseIsbn("9788936434120"), "9788936434120");
  assert.equal(parseIsbn("0306406152"), "9780306406157");
  assert.equal(parseIsbn("8936434128"), "9788936434120");
});

test("ISBN: 그 밖의 값은 거절", () => {
  for (const bad of ["", "978893643412", "97889364341200", "978-8936434120", "893643412X", "9788936434120 ", "<svg>", "１２３４５６７８９０"]) {
    assert.equal(parseIsbn(bad), null, bad);
  }
});

test("도서관 코드: 숫자만", () => {
  assert.ok(isLibCode("111314"));
  assert.ok(!isLibCode("11a314"));
  assert.ok(!isLibCode(""));
  assert.ok(!isLibCode("1".repeat(13)));
});

test("bookExist: Y/N 문자열", () => {
  const body = { response: { result: { hasBook: "Y", loanAvailable: "N" } } };
  assert.deepEqual(parseBookExist(body), { hasBook: true, loanAvailable: false });
});

test("bookExist: true/false 값", () => {
  const body = { response: { result: { hasBook: true, loanAvailable: true } } };
  assert.deepEqual(parseBookExist(body), { hasBook: true, loanAvailable: true });
});

test("bookExist: 소장이 없으면 대출 가능도 아니다", () => {
  const body = { response: { result: { hasBook: "N", loanAvailable: "Y" } } };
  assert.deepEqual(parseBookExist(body), { hasBook: false, loanAvailable: false });
});

test("bookExist: 필드가 없거나 오류 응답이면 null", () => {
  assert.equal(parseBookExist({ response: { error: "한도 초과" } }), null);
  assert.equal(parseBookExist({}), null);
  assert.equal(parseBookExist(null), null);
  assert.equal(parseBookExist("<html>"), null);
});

test("도서관 목록: 감싼 모양·안 감싼 모양 둘 다, 위험한 주소는 버림", () => {
  const body = {
    response: {
      libs: [
        { lib: { libCode: "111314", libName: "가도서관", address: "서울특별시 마포구 1", homepage: "www.a.kr" } },
        { libCode: 222, libName: "나도서관", address: "", homepage: "javascript:alert(1)" },
        { lib: { libName: "코드 없음" } },
      ],
    },
  };
  assert.deepEqual(parseLibraries(body, "11"), [
    { code: "111314", name: "가도서관", address: "서울특별시 마포구 1", homepage: "http://www.a.kr", region: "11" },
    { code: "222", name: "나도서관", address: "", homepage: "", region: "11" },
  ]);
});

test("책 검색: ISBN 13자리와 제목이 있는 것만", () => {
  const body = {
    response: {
      docs: [
        { doc: { bookname: "소년이 온다", authors: "한강 지음", publisher: "창비", publication_year: "2014", isbn13: "9788936434120", bookImageURL: "https://img.example/1.jpg" } },
        { doc: { bookname: "ISBN 없음", isbn13: "" } },
      ],
    },
  };
  assert.deepEqual(parseBooks(body), [
    { isbn13: "9788936434120", title: "소년이 온다", authors: "한강 지음", publisher: "창비", year: "2014", cover: "https://img.example/1.jpg" },
  ]);
});

test("safeUrl", () => {
  assert.equal(safeUrl("https://lib.go.kr"), "https://lib.go.kr");
  assert.equal(safeUrl("data:text/html,x"), "");
  assert.equal(safeUrl(undefined), "");
});

test("어제 기준: 한국 시간으로 하루 전", () => {
  assert.equal(loanBaseLabel(new Date("2026-10-27T12:00:00+09:00")), "10월 26일(월)");
  // 한국 10/27 00:30 = UTC 10/26. UTC로 계산하면 10/25가 나와 틀린다
  assert.equal(loanBaseLabel(new Date("2026-10-27T00:30:00+09:00")), "10월 26일(월)");
  assert.equal(loanBaseLabel(new Date("2026-10-27T23:59:00+09:00")), "10월 26일(월)");
  assert.equal(loanBaseLabel(new Date("2027-01-01T08:00:00+09:00")), "12월 31일(목)");
});

test("시·군·구 뽑기", () => {
  assert.equal(sigunguOf("서울특별시 마포구 망원로 1"), "마포구");
  assert.equal(sigunguOf("경기도 성남시 분당구 정자로 5"), "성남시");
  assert.equal(sigunguOf("세종특별자치시 한누리대로 1"), "기타");
  assert.equal(sigunguOf(""), "기타");
});

test("시·도 뽑기 (공유 링크 도서관을 지역 목록과 대조할 때)", () => {
  assert.equal(sidoOf("서울특별시 마포구 망원로 1"), "11");
  assert.equal(sidoOf("경기도 성남시 분당구 정자로 5"), "31");
  assert.equal(sidoOf("충청북도 청주시 상당구 1"), "33");
  assert.equal(sidoOf("경상남도 창원시 1"), "38");
  assert.equal(sidoOf("전북특별자치도 전주시 1"), "35");
  assert.equal(sidoOf("세종특별자치시 한누리대로 1"), "29");
  assert.equal(sidoOf("마포구 망원로 1"), "");
  assert.equal(sidoOf(""), "");
});
