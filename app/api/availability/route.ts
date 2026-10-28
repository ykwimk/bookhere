import { bookExist, findLibraries } from "@/lib/data4library";
import { isSido } from "@/lib/regions";
import { isLibCode, parseIsbn } from "@/lib/validate";
import { MAX_LIBRARIES } from "@/lib/storage";

// GET /api/availability?isbn=9788936434120&libs=111314,141001&regions=11,31 → 도서관마다 소장·대출 (최대 3곳)
// 한 곳이 실패해도 나머지는 보여 준다 (ok:false = 확인 못 함).
// 한도 보호: 코드가 그 시·도의 도서관 목록(libSrch, 7일 캐시)에 있을 때만 정보나루에 묻는다.
// 목록에 없는 코드는 묻지 않고 ok:false 로 돌려준다. 400 대신 이렇게 하는 이유: 폐관해 목록에서 빠진
// 도서관을 고른 사람이 나머지 도서관 결과와 "폐관했거나 자료 수집이 멈췄을 수 있어요" 안내를 그대로 보게 하려고.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const isbn = parseIsbn(sp.get("isbn") ?? "");
  const codes = [...new Set((sp.get("libs") ?? "").split(",").filter(Boolean))];
  const regions = [...new Set((sp.get("regions") ?? "").split(",").filter(Boolean))];
  if (
    !isbn ||
    codes.length === 0 ||
    codes.length > MAX_LIBRARIES ||
    !codes.every(isLibCode) ||
    regions.length > codes.length ||
    !regions.every(isSido)
  ) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  let known: Set<string>;
  try {
    const lists = await Promise.all(regions.map((region) => findLibraries({ region })));
    known = new Set(lists.flat().map((l) => l.code));
  } catch {
    return Response.json({ error: "upstream" }, { status: 502 });
  }
  const results = await Promise.all(
    codes.map(async (code) => {
      // missing: 목록에 없음 (폐관 안내). 정보나루 실패(한도 초과 등)와 나눠야 멀쩡한 도서관을 지우게 하지 않는다
      if (!known.has(code)) return { code, ok: false, missing: true };
      try {
        return { code, ok: true, ...(await bookExist(code, isbn)) };
      } catch {
        return { code, ok: false };
      }
    }),
  );
  return Response.json({ results });
}
