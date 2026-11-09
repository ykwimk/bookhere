import { librariesWithBook } from '@/lib/data4library';
import { isSido } from '@/lib/regions';
import { parseIsbn } from '@/lib/validate';

// GET /api/holders?isbn=9788936434120&region=11 → 그 시·도에서 이 책을 가진 도서관
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const isbn = parseIsbn(sp.get('isbn') ?? '');
  const region = sp.get('region') ?? '';
  if (!isbn || !isSido(region))
    return Response.json({ error: 'bad request' }, { status: 400 });
  try {
    return Response.json({ libraries: await librariesWithBook(isbn, region) });
  } catch {
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
