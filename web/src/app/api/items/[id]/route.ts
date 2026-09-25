import { sql } from '@/lib/db';
import { getItem } from '@/lib/data';
import { deletePhoto } from '@/lib/storage';
import { fail, json, withUser } from '../../_util';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };
const STATUSES = new Set(['new', 'kept', 'listed', 'sold', 'donated', 'discarded']);
const VERDICTS = new Set(['keep', 'build', 'let_go', 'retake']);

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withUser(async user => {
    const item = await getItem(user.id, id);
    if (!item) return fail('Not found', 404);
    const b = await req.json().catch(() => ({}));
    const status = b.status && STATUSES.has(b.status) ? b.status : item.status;
    const verdict = b.verdict && VERDICTS.has(b.verdict) ? b.verdict : item.verdict;
    let sold: number | null = item.sold_amount == null ? null : Number(item.sold_amount);
    if (status === 'sold') {
      const n = Number(b.soldAmount);
      if (!Number.isFinite(n) || n < 0 || n > 1e7) return fail('How much did it sell for?');
      sold = n;
    } else if (b.status) sold = null;
    const [r] = await sql`update items set status = ${status}, verdict = ${verdict}, sold_amount = ${sold}, updated_at = now()
                          where id = ${id} and user_id = ${user.id} returning id, status, verdict, sold_amount`;
    return json(r);
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return withUser(async user => {
    const item = await getItem(user.id, id);
    if (!item) return fail('Not found', 404);
    if (item.photo_path) await deletePhoto(item.photo_path);
    await sql`delete from items where id = ${id} and user_id = ${user.id}`;
    return json({ ok: true });
  });
}
