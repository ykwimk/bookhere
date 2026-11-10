// 검색엔진에 알릴 대표 주소. Vercel 이 운영 도메인(커스텀 도메인이 있으면 그것, 없으면 vercel.app)을 넣어 준다.
export const SITE = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000',
);
