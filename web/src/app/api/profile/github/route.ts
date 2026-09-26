import { fetchRepos } from '@/lib/github';
import { getProfile, saveProfile } from '@/lib/data';
import { fail, json, withUser } from '../../_util';

export const dynamic = 'force-dynamic';

export async function POST() {
  return withUser(async u => {
    const { profile, sensitiveConsentAt } = await getProfile(u.id);
    if (!profile.githubUsername && !profile.githubToken) return fail('Save a GitHub username (or a token) first.');
    try {
      const repos = await fetchRepos(profile.githubUsername || '', profile.githubToken);
      await saveProfile(u.id, { ...profile, repos, reposFetchedAt: new Date().toISOString() }, !!sensitiveConsentAt);
      return json({ ok: true, count: repos.length, private: repos.filter(r => r.private).length, repos: repos.slice(0, 12).map(r => r.name) });
    } catch (e) { return fail((e as Error).message, 502); }
  });
}
