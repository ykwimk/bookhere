// 정보나루 시·도 코드 (추정, 매뉴얼의 지역 코드표로 확인).
// 시·군·구는 코드표 대신 도서관 주소에서 뽑는다 (코드 250여 개를 추측해 적지 않으려고).
export const SIDO = [
  { code: "11", name: "서울" },
  { code: "21", name: "부산" },
  { code: "22", name: "대구" },
  { code: "23", name: "인천" },
  { code: "24", name: "광주" },
  { code: "25", name: "대전" },
  { code: "26", name: "울산" },
  { code: "29", name: "세종" },
  { code: "31", name: "경기" },
  { code: "32", name: "강원" },
  { code: "33", name: "충북" },
  { code: "34", name: "충남" },
  { code: "35", name: "전북" },
  { code: "36", name: "전남" },
  { code: "37", name: "경북" },
  { code: "38", name: "경남" },
  { code: "39", name: "제주" },
];

export const isSido = (code: string) => SIDO.some((s) => s.code === code);

/** 주소의 첫 낱말에서 시·도 코드를 뽑는다. "충청북도"→충북, "서울특별시"→서울, "전북특별자치도"→전북. 모르면 "". */
export function sidoOf(address: string): string {
  const w = address.trim().split(/\s+/)[0] ?? "";
  const name = w.replace(/^(.)(?:청|라|상)(.)도$/, "$1$2").slice(0, 2);
  return SIDO.find((s) => s.name === name)?.code ?? "";
}

/** 주소의 두 번째 낱말을 시·군·구로 본다. "경기도 성남시 분당구 …" → "성남시". 세종처럼 없으면 "기타". */
export function sigunguOf(address: string): string {
  const w = address.trim().split(/\s+/)[1] ?? "";
  return /[시군구]$/.test(w) ? w : "기타";
}
