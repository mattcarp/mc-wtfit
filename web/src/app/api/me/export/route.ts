import { sql } from '@/lib/db';
import { getProfile, getSettings } from '@/lib/data';
import { withUser } from '../../_util';

export const dynamic = 'force-dynamic';

// GDPR Art. 15/20: everything we hold about you, decrypted, in one file. Your API key is shown masked.
export async function GET() {
  return withUser(async u => {
    const [{ profile, sensitiveConsentAt, updatedAt }, settings, items, [user]] = await Promise.all([
      getProfile(u.id), getSettings(u.id),
      sql`select id, name, category, era, confidence, value_low, value_high, currency, verdict, headline, reason, result, model, status, sold_amount, beneficiary_label, created_at from items where user_id = ${u.id} order by created_at`,
      sql`select id, email, created_at from users where id = ${u.id}`,
    ]);
    const { aiKey, ...s } = settings;
    const body = {
      exportedAt: new Date().toISOString(),
      account: user,
      profile: { ...profile, githubToken: profile.githubToken ? `${profile.githubToken.slice(0, 11)}…` : undefined }, profileUpdatedAt: updatedAt, sensitiveConsentAt,
      settings: { ...s, aiKey: aiKey ? `${aiKey.slice(0, 4)}…${aiKey.slice(-4)}` : null },
      items: items.map(i => ({ ...i, photo: `/api/photos/${i.id}` })),
    };
    return new Response(JSON.stringify(body, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="wtfit-export-${new Date().toISOString().slice(0, 10)}.json"` },
    });
  });
}
