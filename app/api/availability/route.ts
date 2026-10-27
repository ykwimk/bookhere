import { bookExist } from "@/lib/data4library";
import { isLibCode, parseIsbn } from "@/lib/validate";
import { MAX_LIBRARIES } from "@/lib/storage";

// GET /api/availability?isbn=9788936434120&libs=111314,111315 → 도서관마다 소장·대출 (최대 3곳)
// 한 곳이 실패해도 나머지는 보여 준다 (ok:false = 확인 못 함).
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const isbn = parseIsbn(sp.get("isbn") ?? "");
  const codes = [...new Set((sp.get("libs") ?? "").split(",").filter(Boolean))];
  if (!isbn || codes.length === 0 || codes.length > MAX_LIBRARIES || !codes.every(isLibCode)) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const results = await Promise.all(
    codes.map(async (code) => {
      try {
        return { code, ok: true, ...(await bookExist(code, isbn)) };
      } catch {
        return { code, ok: false };
      }
    }),
  );
  return Response.json({ results });
}
