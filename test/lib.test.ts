// 실행: npm test (Node 24의 TypeScript 지우기 기능으로 돈다. 패키지 설치 없이도 `node --test "test/**/*.test.ts"` 로 된다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLibCode, parseIsbn } from '../lib/validate.ts';
import {
  isApiError,
  parseBookExist,
  parseBooks,
  parseLibraries,
  safeUrl,
  shortAuthors,
  shortTitle,
} from '../lib/parse.ts';
import { loanBaseLabel } from '../lib/date.ts';
import { sigunguOf } from '../lib/regions.ts';
import { statusRank, summaryLine } from '../lib/summary.ts';

test('ISBN: 숫자 13자리는 그대로, 10자리는 13자리로', () => {
  assert.equal(parseIsbn('9788936434120'), '9788936434120');
  assert.equal(parseIsbn('0306406152'), '9780306406157');
  assert.equal(parseIsbn('8936434128'), '9788936434120');
});

test('ISBN: 그 밖의 값은 거절', () => {
  for (const bad of [
    '',
    '978893643412',
    '97889364341200',
    '978-8936434120',
    '893643412X',
    '9788936434120 ',
    '<svg>',
    '１２３４５６７８９０',
  ]) {
    assert.equal(parseIsbn(bad), null, bad);
  }
});

test('도서관 코드: 숫자만', () => {
  assert.ok(isLibCode('111314'));
  assert.ok(!isLibCode('11a314'));
  assert.ok(!isLibCode(''));
  assert.ok(!isLibCode('1'.repeat(13)));
});

test('bookExist: Y/N 문자열', () => {
  const body = { response: { result: { hasBook: 'Y', loanAvailable: 'N' } } };
  assert.deepEqual(parseBookExist(body), {
    hasBook: true,
    loanAvailable: false,
  });
});

test('bookExist: true/false 값', () => {
  const body = { response: { result: { hasBook: true, loanAvailable: true } } };
  assert.deepEqual(parseBookExist(body), {
    hasBook: true,
    loanAvailable: true,
  });
});

test('bookExist: 소장이 없으면 대출 가능도 아니다', () => {
  const body = { response: { result: { hasBook: 'N', loanAvailable: 'Y' } } };
  assert.deepEqual(parseBookExist(body), {
    hasBook: false,
    loanAvailable: false,
  });
});

test('bookExist: 필드가 없거나 오류 응답이면 null', () => {
  assert.equal(parseBookExist({ response: { error: '한도 초과' } }), null);
  assert.equal(parseBookExist({}), null);
  assert.equal(parseBookExist(null), null);
  assert.equal(parseBookExist('<html>'), null);
});

// 오류로 보면 call() 이 throw 해서 캐시되지 않는다 (10/27 실제 오류 응답 모양)
test('오류 응답: HTTP 200 본문 오류·빈 본문은 오류, 정상 응답은 아님', () => {
  assert.equal(
    isApiError({
      response: {
        errCode: 'vitalizationErr',
        error: 'API 활성화 상태가아닙니다.',
      },
    }),
    true,
  );
  assert.equal(
    isApiError({ response: { errCode: 'authErr', error: 'x' } }),
    true,
  );
  assert.equal(isApiError({ response: { errCode: 'authErr' } }), true);
  assert.equal(isApiError(null), true);
  assert.equal(
    isApiError({ response: { result: { hasBook: 'Y', loanAvailable: 'N' } } }),
    false,
  );
});

test('도서관 목록: 감싼 모양·안 감싼 모양 둘 다, 위험한 주소는 버림', () => {
  const body = {
    response: {
      libs: [
        {
          lib: {
            libCode: '111314',
            libName: '가도서관',
            address: '서울특별시 마포구 1',
            homepage: 'www.a.kr',
          },
        },
        {
          libCode: 222,
          libName: '나도서관',
          address: '',
          homepage: 'javascript:alert(1)',
        },
        { lib: { libName: '코드 없음' } },
      ],
    },
  };
  assert.deepEqual(parseLibraries(body, '11'), [
    {
      code: '111314',
      name: '가도서관',
      address: '서울특별시 마포구 1',
      homepage: 'http://www.a.kr',
      region: '11',
    },
    { code: '222', name: '나도서관', address: '', homepage: '', region: '11' },
  ]);
});

test('책 검색: ISBN 13자리와 제목이 있는 것만', () => {
  const body = {
    response: {
      docs: [
        {
          doc: {
            bookname: '소년이 온다',
            authors: '한강 지음',
            publisher: '창비',
            publication_year: '2014',
            isbn13: '9788936434120',
            bookImageURL: 'https://img.example/1.jpg',
          },
        },
        { doc: { bookname: 'ISBN 없음', isbn13: '' } },
      ],
    },
  };
  assert.deepEqual(parseBooks(body), [
    {
      isbn13: '9788936434120',
      title: '소년이 온다',
      authors: '한강',
      publisher: '창비',
      year: '2014',
      cover: 'https://img.example/1.jpg',
    },
  ]);
});

test('화면용 제목·저자: 부제·역할 이름표를 뗀다', () => {
  assert.equal(shortTitle('소년이 온다 :한강 장편소설'), '소년이 온다');
  assert.equal(shortTitle('채식주의자:한강 연작소설'), '채식주의자');
  assert.equal(
    shortTitle('Re:제로부터 시작하는 이세계 생활'),
    'Re:제로부터 시작하는 이세계 생활',
  );
  assert.equal(
    shortTitle('해리 포터와 마법사의 돌 =Harry Potter'),
    '해리 포터와 마법사의 돌',
  );
  assert.equal(
    shortTitle('채식주의자 (리마스터판)'),
    '채식주의자 (리마스터판)',
  );
  assert.equal(shortAuthors('지은이: 한강'), '한강');
  assert.equal(
    shortAuthors('지은이: 무라카미 하루키 ;옮긴이: 양윤옥'),
    '무라카미 하루키',
  );
  assert.equal(shortAuthors('글·그림: 백희나'), '백희나');
  assert.equal(shortAuthors('한강 지음'), '한강');
  assert.equal(shortAuthors('김민저'), '김민저');
});

test('책 검색: 제목 검색·낱말 검색을 합치면 대출 많은 순, 같은 ISBN은 한 번', () => {
  const doc = (isbn13: string, bookname: string, loan_count: string) => ({
    doc: { isbn13, bookname, loan_count },
  });
  const byTitle = {
    response: {
      docs: [
        doc('9788936434120', '소년이 온다', '260338'),
        doc('9788997195503', '한 그릇 뚝딱 이유식', '14591'),
      ],
    },
  };
  const byKeyword = {
    response: {
      docs: [
        doc('9788950977795', '보기왕이 온다', '13832'),
        doc('9788936434120', '소년이 온다', '260338'),
      ],
    },
  };
  assert.deepEqual(
    parseBooks(byTitle, byKeyword).map((b) => b.title),
    ['소년이 온다', '한 그릇 뚝딱 이유식', '보기왕이 온다'],
  );
});

test('safeUrl', () => {
  assert.equal(safeUrl('https://lib.go.kr'), 'https://lib.go.kr');
  assert.equal(safeUrl('data:text/html,x'), '');
  assert.equal(safeUrl(undefined), '');
});

test('어제 기준: 한국 시간으로 하루 전', () => {
  assert.equal(
    loanBaseLabel(new Date('2026-10-27T12:00:00+09:00')),
    '10월 26일(월)',
  );
  // 한국 10/27 00:30 = UTC 10/26. UTC로 계산하면 10/25가 나와 틀린다
  assert.equal(
    loanBaseLabel(new Date('2026-10-27T00:30:00+09:00')),
    '10월 26일(월)',
  );
  assert.equal(
    loanBaseLabel(new Date('2026-10-27T23:59:00+09:00')),
    '10월 26일(월)',
  );
  assert.equal(
    loanBaseLabel(new Date('2027-01-01T08:00:00+09:00')),
    '12월 31일(목)',
  );
  assert.equal(
    loanBaseLabel(new Date('2027-01-01T08:00:00+09:00'), true),
    '12/31',
  );
});

test('시·군·구 뽑기', () => {
  assert.equal(sigunguOf('서울특별시 마포구 망원로 1'), '마포구');
  assert.equal(sigunguOf('경기도 성남시 분당구 정자로 5'), '성남시');
  assert.equal(sigunguOf('세종특별자치시 한누리대로 1'), '기타');
  assert.equal(sigunguOf(''), '기타');
});

test('결론 한 줄: 빌릴 수 있는 곳 세기, 확인 못 한 곳은 없다고 하지 않음', () => {
  const yes = { ok: true as const, hasBook: true, loanAvailable: true };
  const out = { ok: true as const, hasBook: true, loanAvailable: false };
  const none = { ok: true as const, hasBook: false, loanAvailable: false };
  const names = ['가도서관', '나도서관', '다도서관'];
  assert.equal(
    summaryLine(names, [yes, out, none])?.line,
    '3곳 중 1곳에서 빌릴 수 있어요',
  );
  assert.equal(
    summaryLine(names, [out, none, none])?.line,
    '3곳 중 1곳에 있지만 대출 중이에요',
  );
  assert.equal(
    summaryLine(names, [none, none, none])?.line,
    '3곳 모두 이 책이 없어요',
  );
  assert.deepEqual(summaryLine(names, [none, { ok: false }, undefined]), {
    line: '확인한 1곳에는 이 책이 없어요',
    available: 0,
    note: '2곳은 확인하지 못했어요',
  });
  assert.equal(
    summaryLine(['가도서관'], [yes])?.line,
    '가도서관에서 빌릴 수 있어요',
  );
  assert.equal(
    summaryLine(['가도서관'], [none])?.line,
    '가도서관에는 이 책이 없어요',
  );
  assert.equal(summaryLine(names, [{ ok: false }, undefined, undefined]), null);
  // 목록 정렬 순위: 빌릴 수 있어요 → 대출 중 → 없음 → 확인 못 함
  assert.deepEqual(
    [yes, out, none, { ok: false as const }, undefined, 'error' as const].map(
      statusRank,
    ),
    [0, 1, 2, 3, 3, 3],
  );
});
