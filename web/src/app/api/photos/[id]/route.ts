import { getItem } from '@/lib/data';
import { readPhoto } from '@/lib/storage';
import { getAppUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getAppUser();
  if (!user) return new Response('Sign in first', { status: 401 });
  const item = await getItem(user.id, id);
  if (!item?.photo_path) return new Response('Not found', { status: 404 });
  try {
    const data = await readPhoto(item.photo_path);
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': item.photo_mime || 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
  } catch { return new Response('Photo unavailable', { status: 404 }); }
}
