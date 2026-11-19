---
name: 책여기
description: 읽고 싶은 책이 내 도서관 3곳에 있는지 한 화면에 보여 주는 무료 웹
colors:
  paper: '#ffffff'
  card: '#f3f4f6'
  raised: '#e8ecf0'
  ink: '#17181a'
  ink-press: '#000000'
  ink-2: '#43474d'
  muted: '#5c6066'
  hint: '#686d73'
  line: '#e5e7ea'
  control: '#d6d9dd'
  mark: '#e2f25c'
  accent: '#2f7d55'
  accent-soft: '#e3f3e8'
  accent-ink: '#1f5c3c'
  warn: '#92400e'
typography:
  display:
    fontFamily: 'Gowun Batang, AppleMyungjo, serif'
    fontSize: '32px'
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif'
    fontSize: '26px'
    fontWeight: 800
    lineHeight: 1.35
    letterSpacing: '-0.03em'
  book-reason:
    fontFamily: 'Gowun Batang, AppleMyungjo, serif'
    fontSize: '21px'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '-0.01em'
  book-title:
    fontFamily: 'Gowun Batang, AppleMyungjo, serif'
    fontSize: '20px'
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 800
    lineHeight: 1.6
  body:
    fontFamily: 'Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Noto Sans KR, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.625
rounded:
  cover: '4px'
  button: '10px'
  pill: '9999px'
spacing:
  gutter: '20px'
  row: '20px'
  block: '48px'
  results: '56px'
  column-gap: '64px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.button}'
    padding: '0 36px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.ink-press}'
  button-primary-disabled:
    backgroundColor: '{colors.ink-2}'
  sentence-input:
    textColor: '{colors.ink}'
    typography: '{typography.display}'
    padding: '0 0 8px 0'
  search-pill:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    height: '48px'
    padding: '0 4px 0 16px'
  search-pill-button:
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    height: '40px'
    padding: '0 16px'
  search-pill-button-hover:
    backgroundColor: '{colors.paper}'
  library-chip:
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: '6px 14px'
  book-cover:
    backgroundColor: '{colors.raised}'
    rounded: '{rounded.cover}'
  status-available:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.accent-ink}'
    rounded: '{rounded.pill}'
    padding: '6px 12px'
  status-loaned:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: '6px 12px'
  region-select:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    height: '48px'
    padding: '0 32px 0 0'
---

# Design System: 책여기

## Overview

**Creative North Star: "형광펜 한 줄 그은 책장" (The Highlighted Page)**

책여기는 흰 종이 위에 먹색 글자로 쓰인 책 한 쪽처럼 보인다. 색은 거의 없고, 형광 연두 형광펜 하나가 "여기를 보라"는 자리에만 밑줄 아래 절반을 칠한다. 화면의 주인공은 문장으로 찾기다: 책에 밑줄을 긋듯 원하는 책을 한 문장으로 적는 큰 바탕체 밑줄 입력이 맨 위에 있고, 제목으로 찾기는 그 옆 (휴대폰은 아래) 의 회색 알약으로 모양부터 다르게 놓인다.

두 목소리가 있다. 책의 목소리 (사람이 적는 문장, 책 제목, AI 가 쓴 이유) 는 고운바탕, 화면의 목소리 (안내·이름표·버튼) 는 Noto Sans KR 을 진하게 쓴다. 결과는 표지와 책 제목이 먼저 눈에 들어오고 (AI 이유는 그 아래 작게), 상자나 카드 없이 가는 선 하나와 여백으로만 줄을 나눈다. 깊이는 표지 아래의 부드러운 그림자 하나뿐이다.

밀도는 낮고 글은 짧다. 중요한 것만 크게, 설명은 작고 흐리게. 움직임도 하나: 결과가 오면 "AI 추천" 아래로 형광펜이 한 번 그어진다.

**Key Characteristics:**

- 흰 종이 + 먹색 글자 + 형광 연두 형광펜 하나
- 책의 목소리는 바탕체, 화면의 목소리는 진한 고딕
- 문장 입력은 밑줄 하나, 제목 검색은 회색 알약 (서로 다른 모양)
- 주 행동은 먹색 사각 버튼 하나. 초록은 "대출 가능" 표시에만
- 상자·카드·말풍선 없이 가는 선과 여백으로 나눈다
- 시그니처 움직임: 결과가 오면 형광펜이 한 번 그어진다

## Colors

흰 종이와 먹색 잉크의 회색 단계, 형광펜 한 자루, 그리고 "빌릴 수 있다" 는 뜻 하나만 맡은 초록으로 끝나는 팔레트다.

### Primary

- **형광 연두 형광펜** (mark): 글자 아래쪽 절반 (52%~94%) 만 칠하는 형광펜 줄. 홈의 예시 문장과 결과 머리의 "AI 추천" 두 곳에만 쓴다. 칠한 위 글자는 늘 먹색이다.

### Secondary

- **대출 초록** (accent): "대출 가능" 알약 안의 체크 표시 색.
- **연한 대출 초록** (accent-soft): "대출 가능" 알약 바탕.
- **진한 대출 초록** (accent-ink): "대출 가능" 알약 글자. 연한 바탕 위에서 읽히는 진한 초록.

### Neutral

- **먹색** (ink): 본문 글자, 주 행동 버튼 바탕, 문장 입력 밑줄, 초점 테두리.
- **진한 먹** (ink-press): 주 행동 버튼을 누르거나 올렸을 때만.
- **옅은 먹** (ink-2): 안내 글 (문구 A, 예시 줄, 결과 설명, 폴백 안내), 기다리는 중의 버튼 바탕. 흐리지 않게 6:1 이상을 유지한다.
- **회색 글** (muted): 책의 저자·출판사 줄, 결과 수, 남은 글자 수, 바닥글, 시리즈 이름.
- **안내 회색** (hint): 입력칸 placeholder 만.
- **종이** (paper): 페이지 바탕, 주 행동 글자색, 알약 안 "찾기" 를 올렸을 때 바탕.
- **알약 회색** (card): 제목 검색 알약 바탕, 가짜 데이터·가짜 AI 안내 띠.
- **자리 회색** (raised): 표지가 오기 전 바탕, 기다리는 동안의 자리 막대.
- **가는 선** (line): 책 줄 사이 위쪽 선, 옆 칸 세로 선, 제목 검색 위 구분 선 (휴대폰), 바닥글 선, 내 도서관 이름 테두리.
- **조용한 회색** (control): 책 화면 "없음" 의 빼기 표시, 표지가 없을 때 대신 그리는 책등 (왼쪽 6px 선).
- **경고 갈색** (warn): 찾기가 실패했을 때의 글과 그 위 선. 바탕을 칠하지 않는다.

### Named Rules

**The One Highlighter Rule.** 형광 연두는 형광펜 줄로만 쓴다: 글자 아래 절반, 위 글자는 먹색. 버튼·배경·아이콘·테두리를 칠하지 않고, 한 화면에 두 곳 (예시 문장, "AI 추천") 을 넘지 않는다.

**The Ink Action Rule.** 주 행동은 먹색이다. 초록·파랑 같은 두 번째 강조색 버튼을 들이지 않는다.

**The Green Means Available Rule.** 초록 세 가지 (accent, accent-soft, accent-ink) 는 책 화면의 "대출 가능" 상태 표시에만 쓴다. 버튼·링크·배경·제목·다른 상태에는 쓰지 않는다. 초록이 보이면 그 책은 빌릴 수 있다는 뜻이어야 한다.

## Typography

**Display Font:** Gowun Batang (with AppleMyungjo, serif)
**Body Font:** Noto Sans KR (with Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif)

**Character:** 붓맛이 남은 바탕체가 사람과 책의 말을, 단단한 고딕 800 이 화면의 말을 맡는다. 둘은 같은 줄에서 섞지 않고 역할로 나뉜다. 모든 글은 `word-break: keep-all` 로 낱말 중간에서 줄을 바꾸지 않고, 숫자는 같은 폭 숫자를 쓴다.

### Hierarchy

- **Display** (바탕 700, PC 32px / 휴대폰 24px, 1.45): 문장으로 찾기 입력 글. placeholder 는 400.
- **Headline** (고딕 800, PC 26px / 휴대폰 22px, 1.35, -0.03em): 화면당 h1 하나 ("어떤 책을 찾나요?").
- **Book Reason** (바탕 400, PC 16px / 휴대폰 15px, 1.5, ink-2): AI 가 쓴 이유. 책 줄에서 제목·저자 줄 아래에 붙는다 (사람은 제목으로 책을 알아본다).
- **Book Title** (바탕 700, 20px, 1.375): 책 줄의 책 제목 (제목 결과·AI 결과 같음). 책 화면에서는 이 책 제목이 h1 이라 바탕 700 22px (1.35) 로 한 단계 크다.
- **Title** (고딕 800, 15px): "제목으로 찾기", "내 도서관" 같은 구역 이름표. 결과 머리 ("‘…’ 제목으로 찾은 책") 는 17px 800.
- **Body** (고딕 400, 15px, 1.6): 안내 한두 줄.
- **Label** (고딕 400, 13px, 1.625): 문구 A, 저자·출판사 줄, 출처, 바닥글. 남은 글자 수는 12px.

### Named Rules

**The Two Voices Rule.** 바탕체는 사람이 적은 문장·책 제목·AI 이유에만, 고딕은 화면의 말에만. 버튼·이름표에 바탕체를 쓰지 않고, 책 제목을 고딕 크게 쓰지 않는다.

## Layout

휴대폰이 먼저다. 한 기둥에 문장 입력 → 문장 결과 → 제목 알약 → 제목 결과 → 내 도서관 순서로 쌓고, 옆 여백 20px (gutter). 1024px (64rem) 부터 두 칸이 된다: 왼쪽 304px (19rem) 옆 칸, 오른쪽 큰 칸, 사이 64px (column-gap). 옆 칸은 가는 세로 선으로 닫고 안쪽 여백은 위 4px · 오른쪽 32px · 아래 40px.

두 칸은 CSS class 하나 (`globals.css` 의 `.cols` / `.cols-side`) 로 세 화면이 같이 쓴다.

- **홈·문장으로 찾기:** 옆 칸에 제목 알약과 내 도서관, 큰 칸에 문장 입력과 결과.
- **책 (`/book/[isbn]`):** 옆 칸에 책 정보 (표지 위, 글 아래) · 공유 단추 · 다른 판 찾기, 큰 칸에 대출 결과와 같은 지역 다른 도서관.
- **내 도서관 고르기 (`/libraries`):** 옆 칸에 제목·설명·고른 도서관 n/3·"다 골랐어요", 큰 칸에 지역 고르기와 목록.

휴대폰에서는 옆 칸 상자가 사라지고 (`display: contents`) 안의 것이 한 줄에 그대로 놓인다. 한 화면에서 PC 와 휴대폰 자리가 다른 것 (다른 판 찾기, "다 골랐어요") 은 CSS `order` 로 옮기지 않고 두 자리에 두어 한쪽만 보인다. Tab·화면 읽기 순서가 보이는 순서와 같아야 해서다.

**옆 칸 따라오기:** PC 에서 창 높이가 40rem (640px) 이상이면 옆 칸이 `position: sticky; top: 2rem` 으로 스크롤을 따라온다. 그보다 낮은 창에서는 따라오지 않는다 (옆 칸 아래가 화면 밖에 남지 않게). 옆 칸이 창보다 길어질 수 있는 화면 (도서관 고르기) 만 `.cols-side-scroll` 로 높이를 `100dvh - 3rem` 에 묶고, 넘칠 때만 칸 안에서 내린다 (왼쪽 4px 여유로 초점 테두리가 잘리지 않게, 글 자리는 그대로). 따라오는 제목 칸으로 결과를 내린 채 다시 찾으면, PC 에서는 결과 머리가 화면 위로 지나갔어도 그 자리로 올려 준다 (위 32px 여유). 휴대폰은 결과가 제목 칸 바로 아래라 움직이지 않는다.

머리줄과 바닥글은 어느 화면이나 같은 폭 (최대 72rem) 이라, 화면을 오가도 로고가 그 자리에 있다. 두 칸 화면 (홈·책·내 도서관 고르기) 은 본문도 72rem 을 다 쓰고, 안내 (`/ask/about`)·없는 주소 같은 글 화면과 문장으로 찾기가 닫힌 홈 (한 기둥) 은 36rem 좁은 기둥을 가운데가 아니라 로고 아래 왼쪽에 붙인다. `.cols` 가 있으면 넓고, 없으면 CSS `:has()` 로 자동으로 좁아진다. 알려진 한계: `:has()` 를 모르는 옛 브라우저에서는 좁은 기둥 규칙이 통째로 빠져 글 화면 본문도 72rem 까지 넓어진다 (왼쪽 정렬과 읽기는 그대로). 결과 목록은 읽기 폭 48rem, 문구 A 는 42rem 을 넘지 않는다. 제목 검색 결과는 PC 에서 두 줄 격자 (사이 40px).

리듬: 구역 사이 48px (block), 입력과 결과 사이 56px (results), 책 줄 위아래 20px (row), 표지와 글 사이 휴대폰 16px / PC 24px. 누를 수 있는 것은 높이 44px 이상.

## Elevation & Depth

평평하다. 면을 띄우지 않고 가는 선과 여백, 회색 알약 하나로 층을 나눈다. 그림자는 책 표지 아래에만 있다: 종이 위에 놓인 책처럼 아래로만 번지는 부드러운 그림자.

### Shadow Vocabulary

- **표지 그림자** (`box-shadow: 0 10px 18px -12px rgba(0,0,0,0.45)`): 책 줄과 책 화면의 표지 이미지에만.
- **입력 초점 밑줄** (`box-shadow: 0 2px 0 0 var(--color-ink)`): 문장 입력에 초점이 오면 밑줄이 두 배로 두꺼워진다. 깊이가 아니라 상태 표시.

### Named Rules

**The Cover-Only Shadow Rule.** 그림자는 표지만 받는다. 버튼·알약·목록·안내, 화면 아래에 붙는 행동 띠에도 그림자를 주지 않는다. 띠는 종이색 바탕으로만 아래 글을 가린다.

## Shapes

세 가지 모양만 있다: 표지의 살짝 둥근 모서리 (4px), 주 행동 버튼의 단단한 사각 (10px), 제목 검색·내 도서관 이름·대출 상태의 완전한 알약 (9999px). 문장 입력은 상자가 아니라 먹색 2px 밑줄 하나, 지역 고르는 칸은 먹색 1px 밑줄 하나다. 구분은 위쪽 가는 선 (1px, line) 으로 하고, 내용을 감싸는 상자는 없다.

### Named Rules

**The Two Shapes of Search Rule.** 문장으로 찾기는 밑줄, 제목으로 찾기는 회색 알약과 돋보기. 둘을 같은 모양으로 만들지 않는다.

**The No-Box Rule.** 결과·안내·내 도서관을 회색 상자나 카드에 담지 않는다. 줄은 위쪽 가는 선으로, 구역은 여백으로 나눈다. 알약은 제목 검색, 도서관 이름, 그리고 이름 붙은 예외 하나인 대출 상태 ("대출 가능", "대출 중") 에만. 상태 알약은 줄 전체가 아니라 오른쪽 짧은 글만 감싼다.

## Components

### Buttons

담백하고 단단하다. 하나의 먹색 사각이 화면의 주 행동이다.

- **Shape:** 단단한 사각 (10px), 높이 48px.
- **Primary:** 먹색 바탕, 흰 글자 고딕 700 16px, 좌우 36px. 휴대폰은 전체 폭, PC 는 글 폭.
- **Hover / Focus / Active:** 올리면 진한 먹, 누르면 0.98 로 살짝 줄어든다. 초점은 먹색 2px 테두리 + 2px 띄움 (모든 요소 공통). 기다리는 중에는 옅은 먹 바탕에 돌아가는 원 아이콘, 글자는 투명하게만 해서 폭을 지킨다.
- **알약 안 글자 버튼:** 제목 검색의 "찾기" 는 바탕 없는 먹색 글자 (700 15px, 높이 40px, 알약 모양). 올리면 흰 바탕이 알약 안에 떠오른다. 먹색 사각 버튼과 일부러 다르다.

### Chips

- **Style:** 내 도서관 이름. 바탕 없이 가는 선 테두리의 알약, 고딕 500 14px, 안쪽 6px 14px, 사이 8px.
- **State:** 선택·필터 상태 없음. 이름을 보여 주기만 한다.

### Inputs / Fields

- **문장 입력:** 바탕 없음, 먹색 2px 밑줄, 바탕 700 Display 크기, 쓴 줄만큼 높이가 자란다 (200자 상한, 오른쪽 아래 남은 글자 수). 초점이면 밑줄이 4px 로 두꺼워지고 테두리 상자는 그리지 않는다.
- **제목 검색 알약:** 알약 회색 바탕, 높이 48px, 왼쪽 18px 돋보기 (회색 글 색), 고딕 500 16px. 초점은 알약 바깥에 먹색 2px 테두리. 글을 지우는 × 는 브라우저 기본 모양 (파란 ×) 을 지우고 아이콘 벌과 같은 선 × (18px, 회색 글 색, 올리면 먹색) 로 그린다. 지우는 동작은 브라우저 그대로.
- **지역 고르기 (시·도, 시·군·구):** 브라우저 기본 `<select>` 를 그대로 두고 (고르기·키보드는 기본 동작), 모양만 바꾼다. 상자 없이 먹색 1px 밑줄, 종이 바탕, 높이 48px, 고딕 500 16px. 기본 화살표를 지운 자리 오른쪽에 아래 꺾쇠 (ChevronDownIcon, 20px, 회색 글 색). 아직 안 골랐으면 글자를 안내 회색으로, 펼친 목록은 먹색. 초점은 다른 요소와 같은 먹색 2px 테두리 + 2px 띄움. 이름표는 Title (고딕 800 15px). 휴대폰은 시·도 아래 시·군·구, PC 는 큰 칸에 두 칸을 한 줄에 나란히 (사이 32px).
- **Error:** 실패는 경고 갈색 글과 그 위 경고 갈색 가는 선. 바탕을 칠하지 않고, 아래에 밑줄 글 링크로 다른 길 ("제목·저자로 찾기") 을 준다.

### Navigation

- 머리줄 높이 64px (PC 72px). 왼쪽 책갈피 모양 표시 + "책여기" 고딕 700 18px, 오른쪽 "내 도서관" 글 링크 (600 15px, 올리면 알약 회색 바탕). 메뉴 묶음·햄버거 없음.
- 본문 속 링크는 밑줄 글 (밑줄 2~4px 띄움), 올리면 먹색.

### 책 줄 (Book Row)

제목 결과와 문장 결과가 같이 쓰는 시그니처 줄. 위쪽 가는 선, 위아래 20px.

- **AI 결과:** 표지 칸 112px (PC 160px), 표지 최대 높이 160px (PC 220px). 오른쪽 글은 제목 결과와 같은 제목 블록 (시리즈·제목·저자 줄) 이고, 그 아래 12px 띄워 이유 (Book Reason).
- **제목 결과:** 표지 칸 96px (PC 112px), 표지 높이 140px (PC 160px). 시리즈 이름은 바탕 14px 회색으로 제목 위에 따로, 제목은 Book Title.
- 표지는 받은 크기보다 키우지 않는다. 표지 그림자 + 4px 모서리 + 5% 검정 안쪽 선.
- 줄 전체가 링크다. 올리면 제목에 밑줄.
- **책 화면 머리:** 같은 표지 규칙을 쓴다. 휴대폰은 표지 칸 96×140px, 오른쪽에 시리즈 이름·책 제목 (바탕 22px)·저자 줄, 그 오른쪽 끝에 공유 단추. PC 는 옆 칸에 표지 칸 160×220px (AI 결과 줄 PC 표지와 같은 값) 을 위에, 글을 아래 (사이 24px) 에 두고, 공유 단추는 제목·저자 줄 오른쪽에 아래 맞춤. 표지 그림자 + 4px 모서리. 표지가 없으면 알약 회색 바탕에 왼쪽 6px 조용한 회색 책등을 그린다.

### 대출 상태 (Availability Status)

책 화면에서 내 도서관마다 한 줄: 위쪽 가는 선, 높이 56px 이상, 왼쪽 도서관 이름 (고딕 500 16px), 오른쪽 상태. 표시는 늘 아이콘 + 글자를 함께 쓴다 (색이나 아이콘만으로 구분하지 않는다).

- **대출 가능:** 연한 대출 초록 알약, 진한 대출 초록 글자 600 14px, 대출 초록 체크. 안쪽 6px 12px.
- **대출 중:** 알약 회색 알약, 먹색 글자 500 14px, 회색 글 색 모래시계. 안쪽 6px 12px.
- **없음 / 확인 못 함:** 알약 없이 회색 글 14px. 없음은 조용한 회색 빼기 표시를 붙인다.
- 기다리는 동안은 알약 자리의 자리 막대.

### 아래 행동 띠 (Sticky Action)

- 휴대폰: 내 도서관 고르기에서 하나라도 고르면 주 행동 ("다 골랐어요") 이 화면 아래에 붙는다. 종이색 바탕 띠, 위아래 16px, 그림자·선 없음. 버튼은 먹색 사각 그대로.
- PC: 화면 아래 띠는 없다. 버튼은 따라오는 옆 칸의 고른 도서관 아래 (사이 40px) 에 있고, 하나라도 골랐을 때만 그린다 (0곳이면 첫 할 일인 시·도 고르기가 먼저 보이게).

### 없는 주소 (Not Found)

- 머리줄·바닥글은 그대로, 본문은 좁은 기둥 왼쪽에 Headline 한 줄과 밑줄 글 링크 하나 ("처음으로"). 그림·큰 숫자·설명 없음. 늘 밝은 종이 바탕 (어두운 모드에서도 검게 바뀌지 않는다).

### 아이콘

- 선 아이콘 한 벌 (`components/Icons.tsx`): 체크, 모래시계, 빼기, 돌아가는 원, 바깥 화살표, 달력, 공유, 돋보기, 아래 꺾쇠 (ChevronDownIcon: 고르는 칸과 펼치기), 오른쪽 화살표. 글자 크기 옆 14~20px, 색은 글자 색이나 회색 글을 따른다.

### 형광펜 (Highlighter Mark)

- 글자 아래 절반 (52%~94%) 을 형광 연두로 칠하고 좌우 0.12em 여유. 줄이 바뀌어도 줄마다 칠한다.
- 결과가 오면 "AI 추천" 위에서 왼쪽부터 0.7초에 한 번 그어진다 (0.15초 뒤 시작, `cubic-bezier(0.6, 0, 0.2, 1)`). 움직임 줄이기를 켜면 처음부터 다 칠해져 있다.

### 기다림 (Loading)

- 문장 결과를 기다리는 동안 책 줄 모양 그대로의 자리 막대 4줄 (자리 회색, 천천히 깜빡임) 과 옅은 먹 안내 한 줄. 버튼 안에는 돌아가는 원.

## Do's and Don'ts

### Do:

- **Do** 형광 연두를 글자 아래 절반의 형광펜 줄로만, 예시 문장과 "AI 추천" 에만 쓴다.
- **Do** 사람이 적은 문장·책 제목은 고운바탕 700, AI 이유는 고운바탕 400, 화면의 말은 Noto Sans KR 500~800 으로 쓴다.
- **Do** 결과 줄을 위쪽 가는 선 (line) 과 20px 여백으로 나눈다.
- **Do** 주 행동은 먹색 사각 (10px, 높이 48px) 하나로 둔다.
- **Do** 초록은 "대출 가능" 알약에만 쓰고, 상태는 아이콘 + 글자로 함께 보인다.
- **Do** 머리줄·바닥글은 어느 화면이나 72rem 으로 둔다. 두 칸 화면 (홈·책·내 도서관 고르기) 은 `.cols` 하나를 같이 쓰고, 안내·없는 주소 같은 글 화면의 본문은 36rem 기둥을 로고 아래 왼쪽에 둔다.
- **Do** 문장 입력은 밑줄, 제목 검색은 회색 알약 + 돋보기로 모양을 나눈다.
- **Do** 누를 수 있는 것은 44px 이상, 초점은 먹색 2px 테두리 + 2px 띄움으로 둔다.
- **Do** 움직임 줄이기를 켠 사람에게는 모든 움직임을 끄고 끝 상태를 보여 준다.

### Don't:

- **Don't** 형광 연두로 버튼·배경·배지·아이콘을 칠하지 않는다.
- **Don't** 버튼·링크·배경에 초록이나 두 번째 강조색을 쓰지 않는다. 초록은 "대출 가능" 표시 전용이다.
- **Don't** 결과·안내·내 도서관을 회색 둥근 상자나 카드에 담지 않는다 (대출 상태 알약은 예외).
- **Don't** 지역 고르는 칸을 회색 상자나 테두리 상자로 만들지 않는다.
- **Don't** 표지 말고 다른 것에 그림자를 주지 않는다.
- **Don't** 문장 입력을 회색 상자 검색칸으로 만들지 않는다.
- **Don't** 버튼·이름표에 바탕체를 쓰지 않는다.
