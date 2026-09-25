import { sql } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const base = process.env.APP_URL || new URL(req.url).origin;
  if (token.length < 20) return Response.redirect(`${base}/?waitlist=invalid#join`, 302);
  const r = await sql`update waitlist set confirmed_at = coalesce(confirmed_at, now()) where token = ${token} returning email`;
  return Response.redirect(`${base}/?waitlist=${r.length ? 'confirmed' : 'invalid'}#join`, 302);
}
