import { sql } from '@/lib/db';
import { authMode } from '@/lib/auth';
import { deleteUserPhotos } from '@/lib/storage';
import { fail, json, withUser } from '../_util';

export const dynamic = 'force-dynamic';

// GDPR Art. 17: delete everything. Rows cascade from users; photos are removed from disk; the Clerk account goes too.
export async function DELETE(req: Request) {
  return withUser(async u => {
    const b = await req.json().catch(() => ({}));
    if (b.confirm !== 'DELETE') return fail('Type DELETE to confirm.');
    await deleteUserPhotos(u.id);
    await sql`delete from users where id = ${u.id}`;
    if (authMode() === 'clerk') {
      try { const { clerkClient } = await import('@clerk/nextjs/server'); await (await clerkClient()).users.deleteUser(u.id); }
      catch (e) { console.error('[delete] clerk', e); }
    }
    return json({ ok: true });
  });
}
