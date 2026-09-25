import { sql } from '@/lib/db';
import { authMode } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  let db = false;
  try { await sql`select 1`; db = true; } catch {}
  return Response.json({
    ok: db, db, auth: authMode(),
    email: !!process.env.RESEND_API_KEY,
    sharedModel: !!process.env.SERVER_AI_PROVIDER,
    encryption: !!process.env.ENCRYPTION_KEY,
  }, { status: db ? 200 : 503 });
}
