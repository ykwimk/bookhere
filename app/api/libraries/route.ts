import { findLibraries } from '@/lib/data4library';
import { isSido } from '@/lib/regions';

// GET /api/libraries?region=11 → 그 시·도의 도서관 목록
export async function GET(req: Request) {
  const region = new URL(req.url).searchParams.get('region') ?? '';
  if (!isSido(region))
    return Response.json({ error: 'bad region' }, { status: 400 });
  try {
    return Response.json({ libraries: await findLibraries({ region }) });
  } catch {
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
