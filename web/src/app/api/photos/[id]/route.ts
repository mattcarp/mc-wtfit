import { getItem } from '@/lib/data';
import { readPhoto } from '@/lib/storage';
import { getAppUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getAppUser();
  if (!user) return new Response('Sign in first', { status: 401 });
  const item = await getItem(user.id, id);
  if (!item?.photo_path) return new Response('Not found', { status: 404 });
  const n = Number(new URL(req.url).searchParams.get('i') || 0);
  const path = n > 0 ? item.extra_photos?.[n - 1] : item.photo_path;
  if (!path) return new Response('Not found', { status: 404 });
  try {
    const data = await readPhoto(path);
    return new Response(new Uint8Array(data), { headers: { 'Content-Type': n > 0 ? 'image/jpeg' : (item.photo_mime || 'image/jpeg'), 'Cache-Control': 'private, max-age=86400' } });
  } catch { return new Response('Photo unavailable', { status: 404 }); }
}
