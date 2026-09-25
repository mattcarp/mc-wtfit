import 'server-only';

export type RepoSummary = { name: string; description: string | null; language: string | null; topics: string[] };

/** Public repos for a GitHub username: the richest "what are you into" signal most developers have. */
export async function fetchRepos(username: string): Promise<RepoSummary[]> {
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) throw new Error('That does not look like a GitHub username');
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'wtfit' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, { headers });
  if (r.status === 404) throw new Error('No GitHub user by that name');
  if (!r.ok) throw new Error(`GitHub said ${r.status}`);
  const repos = (await r.json()) as Array<{ name: string; description: string | null; language: string | null; topics?: string[]; fork: boolean; archived: boolean }>;
  return repos
    .filter(x => !x.fork)
    .slice(0, 60)
    .map(x => ({ name: x.name, description: x.description, language: x.language, topics: x.topics ?? [] }));
}
