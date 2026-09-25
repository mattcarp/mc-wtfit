'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type P = Record<string, unknown> & { repos?: { name: string }[]; reposFetchedAt?: string };

const FIELDS: { key: string; label: string; hint: string; area?: boolean }[] = [
  { key: 'displayName', label: 'What should we call you?', hint: 'Optional.' },
  { key: 'homes', label: 'Homes', hint: 'Where your stuff lives. e.g. "Townhouse in Valletta, farmhouse in Gozo, a studio".', area: true },
  { key: 'household', label: 'Household', hint: 'Who (and what) lives with you: partner, kids, dogs, a cat with opinions.', area: true },
  { key: 'projects', label: 'Projects', hint: 'What you are building, fixing or planning. Hardware, home, garden, music, anything.', area: true },
  { key: 'skills', label: 'Skills', hint: 'Soldering? Woodwork? Cooking? Sewing? Code?', area: true },
  { key: 'hobbies', label: 'Hobbies', hint: 'What you do for fun.', area: true },
  { key: 'interests', label: 'Interests', hint: 'What you read about, watch, collect.', area: true },
  { key: 'habits', label: 'Habits', hint: 'e.g. "cook every day", "never print anything", "gym three times a week".', area: true },
  { key: 'goals', label: 'Goals', hint: 'e.g. "get the studio set up", "move to a smaller place", "stop buying gadgets".', area: true },
  { key: 'gear', label: 'Gear you know you have', hint: 'Anything WTFIT should know about before you start scanning: projectors, tools, consoles, instruments.', area: true },
];

export function ProfileForm({ initial, consented }: { initial: P; consented: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<P>(initial);
  const [consent, setConsent] = useState(consented);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [gh, setGh] = useState<string>(initial.repos ? `${initial.repos.length} repos loaded` : '');
  const set = (k: string, v: string) => { setP(x => ({ ...x, [k]: v })); setState('idle'); };

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setState('saving'); setMsg('');
    const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: p, sensitiveConsent: consent }) });
    if (!r.ok) { setState('error'); setMsg((await r.json().catch(() => ({}))).error || 'Could not save'); return false; }
    setState('saved'); router.refresh(); return true;
  }
  async function loadRepos() {
    if (!(await save())) return;
    setGh('Fetching…');
    const r = await fetch('/api/profile/github', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    setGh(r.ok ? `${d.count} repos loaded: ${d.repos.join(', ')}${d.count > d.repos.length ? '…' : ''}` : d.error || 'Failed');
  }

  return (
    <form className="form" onSubmit={save}>
      <fieldset className="fieldset">
        <legend>Your projects on GitHub</legend>
        <div className="field">
          <label htmlFor="gh">GitHub username</label>
          <span className="hint">We read your public repositories&apos; names and descriptions so WTFIT knows what you build. Nothing is written to GitHub.</span>
          <div className="actions-row">
            <input id="gh" type="text" autoComplete="off" value={String(p.githubUsername ?? '')} onChange={e => set('githubUsername', e.target.value)} placeholder="e.g. mattcarp" style={{ maxWidth: 280 }} />
            <button type="button" className="btn sm ghost" onClick={loadRepos} disabled={!p.githubUsername}>Load repos</button>
          </div>
          {gh && <span className="hint mono">{gh}</span>}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Your life, briefly</legend>
        {FIELDS.map(f => (
          <div className="field" key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            <span className="hint" id={`${f.key}-h`}>{f.hint}</span>
            {f.area
              ? <textarea id={f.key} aria-describedby={`${f.key}-h`} value={String(p[f.key] ?? '')} onChange={e => set(f.key, e.target.value)} />
              : <input id={f.key} type="text" aria-describedby={`${f.key}-h`} value={String(p[f.key] ?? '')} onChange={e => set(f.key, e.target.value)} />}
          </div>
        ))}
      </fieldset>

      <fieldset className="fieldset">
        <legend>Anything else (optional)</legend>
        <div className="field">
          <label htmlFor="anythingElse">Anything else that would help judge your stuff</label>
          <span className="hint" id="ae-h">Some people share things like faith, relationships, health or identity because it changes what they use. You never have to. If you do, it is treated as special-category data under GDPR: encrypted, used only for your verdicts, never shown back in results, deleted when you ask.</span>
          <textarea id="anythingElse" aria-describedby="ae-h" value={String(p.anythingElse ?? '')} onChange={e => set('anythingElse', e.target.value)} />
        </div>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setState('idle'); }} />
          <span>I explicitly consent to WTFIT processing what I write in this section, including any sensitive information, to make recommendations for me. I can withdraw this by clearing the box and the text.</span>
        </label>
      </fieldset>

      <div className="actions-row">
        <button className="btn" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save profile'}</button>
        {state === 'saved' && <span className="saved">Saved. Encrypted.</span>}
        {state === 'error' && <span className="error">{msg}</span>}
      </div>
    </form>
  );
}
