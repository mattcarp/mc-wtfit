import 'server-only';

export type RepoSummary = { name: string; description: string | null; language: string | null; topics: string[]; private?: boolean };

/** Public repos for a GitHub username: the richest "what are you into" signal most developers have. */
/**
 * Without a token: public repos for the username.
 * With the user's own read-only token: everything that token can see, private repos included.
 * Only names, descriptions, languages and topics are read. Never code.
 */
export async function fetchRepos(username: string, userToken?: string): Promise<RepoSummary[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'wtf-this' };
  let url: string;
  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
    url = 'https://api.github.com/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member';
  } else {
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) throw new Error('That does not look like a GitHub username');
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    url = `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`;
  }
  const r = await fetch(url, { headers });
  if (r.status === 401) throw new Error('GitHub rejected that token. Check it has not expired.');
  if (r.status === 404) throw new Error('No GitHub user by that name');
  if (!r.ok) throw new Error(`GitHub said ${r.status}`);
  const repos = (await r.json()) as Array<{ name: string; full_name: string; description: string | null; language: string | null; topics?: string[]; fork: boolean; private: boolean }>;
  return repos
    .filter(x => !x.fork)
    .slice(0, 100)
    .map(x => ({ name: userToken ? x.full_name : x.name, description: x.description, language: x.language, topics: x.topics ?? [], private: x.private }));
}
