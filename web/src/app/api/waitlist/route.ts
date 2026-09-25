import { randomBytes } from 'node:crypto';
import { sql } from '@/lib/db';
import { esc, sendEmail } from '@/lib/email';
import { clientIp, limited } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

function cors(req: Request): HeadersInit {
  const origin = req.headers.get('origin') || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin)
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
    : {};
}

export async function OPTIONS(req: Request) { return new Response(null, { status: 204, headers: cors(req) }); }

export async function POST(req: Request) {
  const h = cors(req);
  if (limited(`wl:${clientIp(req)}`, 5, 60 * 60 * 1000)) return Response.json({ error: 'Easy, tiger. Try again later.' }, { status: 429, headers: h });
  let email = '';
  let source = 'site';
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) { const b = await req.json(); email = String(b.email || ''); source = String(b.source || source); }
    else { const f = await req.formData(); email = String(f.get('email') || ''); }
  } catch { return Response.json({ error: 'Bad request' }, { status: 400, headers: h }); }
  email = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) return Response.json({ error: 'That email looks off.' }, { status: 400, headers: h });

  const token = randomBytes(24).toString('base64url');
  const [row] = await sql`insert into waitlist (email, token, source) values (${email}, ${token}, ${source.slice(0, 40)})
                          on conflict (email) do update set token = case when waitlist.confirmed_at is null then excluded.token else waitlist.token end
                          returning confirmed_at, token`;
  if (row.confirmed_at) return Response.json({ ok: true, status: 'already-confirmed' }, { headers: h });

  const base = process.env.APP_URL || new URL(req.url).origin;

  // No Resend key but Clerk is on: let Clerk send the email, as an invitation to sign up.
  if (!process.env.RESEND_API_KEY && process.env.CLERK_SECRET_KEY) {
    const inv = await clerkInvite(email, `${base}/sign-up`);
    if (inv.ok) {
      await sql`update waitlist set source = ${`${source.slice(0, 30)}+invite`} where email = ${email}`;
      return Response.json({ ok: true, status: 'check-inbox' }, { headers: h });
    }
    console.error('[waitlist] clerk invitation failed', inv.error);
  }

  const link = `${base}/api/waitlist/confirm?token=${encodeURIComponent(row.token)}`;
  const r = await sendEmail({
    to: email,
    subject: 'What the fuck this? Click. Join tribe.',
    text: `One click. You in tribe:\n\n${link}\n\nNot you? Ignore this email. Nothing happen.\n\nWTF This. Money from thing you let go go to the Gozo SPCA by default.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0A0A0B">
      <p style="font:800 28px/1 Arial Narrow,Arial,sans-serif;text-transform:uppercase;margin:0 0 16px">What the fuck <span style="background:#D4FF3F">this?</span></p>
      <p>One click. You in tribe.</p>
      <p><a href="${esc(link)}" style="display:inline-block;background:#0A0A0B;color:#fff;padding:14px 22px;text-decoration:none">Yes. Me join.</a></p>
      <p style="color:#5C5E63;font-size:14px">Not you? Ignore this email. Nothing happen.<br>Money from thing you let go go to the Gozo SPCA by default.</p></div>`,
  });
  return Response.json({ ok: true, status: r.sent ? 'check-inbox' : 'saved' }, { headers: h });
}

async function clerkInvite(email: string, redirectUrl: string): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch('https://api.clerk.com/v1/invitations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_address: email, redirect_url: redirectUrl, notify: true, ignore_existing: true, public_metadata: { source: 'wtfit-waitlist' } }),
  });
  if (r.ok) return { ok: true };
  const body = await r.text();
  // Already invited or already a user: treat as success, they already have a way in.
  if (r.status === 422 && /duplicate|already|exists/i.test(body)) return { ok: true };
  return { ok: false, error: `${r.status} ${body.slice(0, 300)}` };
}
