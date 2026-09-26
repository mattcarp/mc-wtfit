import { getProfile, PROFILE_TEXT_FIELDS, publicProfile, saveProfile, type Profile } from '@/lib/data';
import { fail, json, withUser } from '../_util';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withUser(async u => { const p = await getProfile(u.id); return json({ ...p, profile: publicProfile(p.profile) }); });
}

export async function PUT(req: Request) {
  return withUser(async u => {
    const b = await req.json().catch(() => null);
    if (!b || typeof b !== 'object') return fail('Bad request');
    const { profile: current } = await getProfile(u.id);
    const next: Profile = { ...current };
    for (const k of PROFILE_TEXT_FIELDS) {
      if (k in b.profile) next[k] = String(b.profile[k] ?? '').slice(0, 5000);
    }
    if ('githubUsername' in b.profile) {
      const gh = String(b.profile.githubUsername ?? '').trim().replace(/^@/, '').slice(0, 39);
      if (gh !== current.githubUsername) { next.githubUsername = gh; next.repos = undefined; next.reposFetchedAt = undefined; }
    }
    // githubToken: undefined = keep, "" = remove, string = replace
    if (typeof b.githubToken === 'string') {
      const t = b.githubToken.trim();
      if (t && !/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) return fail('That does not look like a GitHub token (they start with github_pat_ or ghp_).');
      next.githubToken = t || undefined;
      next.repos = undefined; next.reposFetchedAt = undefined;
    }
    const sensitive = !!b.sensitiveConsent;
    if (next.anythingElse?.trim() && !sensitive) return fail('Tick the consent box to save the "anything else" section, or leave it empty.');
    await saveProfile(u.id, next, sensitive);
    return json({ ok: true });
  });
}
