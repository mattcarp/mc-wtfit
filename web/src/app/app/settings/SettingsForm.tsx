'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Settings } from '@/lib/data';

const PROVIDERS = [
  { v: 'server', label: 'Shared default', hint: 'The model this server provides. Free, with a daily limit.' },
  { v: 'anthropic', label: 'Anthropic (Claude)', hint: 'Your key from console.anthropic.com. Default model: claude-haiku-4-5.' },
  { v: 'openai', label: 'OpenAI', hint: 'Your key from platform.openai.com. Default model: gpt-4.1-mini.' },
  { v: 'google', label: 'Google (Gemini)', hint: 'Your key from aistudio.google.com. Has a free tier. Default model: gemini-2.5-flash.' },
  { v: 'openai-compatible', label: 'OpenAI-compatible (Ollama, OpenRouter, LM Studio…)', hint: 'Any endpoint that speaks the OpenAI API. Needs a vision model.' },
];

export function SettingsForm({ initial, keyHint, shared, defaultBeneficiary, email }: {
  initial: Omit<Settings, never>; keyHint: string | null;
  shared: { provider: string; model: string; limit: number } | null;
  defaultBeneficiary: { name: string; url: string }; email: string | null;
}) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [key, setKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const upd = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS(x => ({ ...x, [k]: v })); setState('idle'); };

  async function save(e: React.FormEvent) {
    e.preventDefault(); setState('saving');
    const body: Record<string, unknown> = { ...s };
    if (key.trim()) body.aiKey = key.trim(); else if (clearKey) body.aiKey = '';
    const r = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { setState('error'); setMsg((await r.json().catch(() => ({}))).error || 'Could not save'); return; }
    setKey(''); setClearKey(false); setState('saved'); router.refresh();
  }
  async function del() {
    const r = await fetch('/api/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: confirmText }) });
    if (r.ok) window.location.href = '/'; else setMsg((await r.json().catch(() => ({}))).error || 'Could not delete');
  }

  return (
    <div className="form">
      <form className="form" onSubmit={save}>
        <fieldset className="fieldset">
          <legend>Where the money goes</legend>
          <div className="radio-row" role="radiogroup" aria-label="Beneficiary">
            <label className="radio"><input type="radio" name="b" checked={s.beneficiaryKind === 'default'} onChange={() => upd('beneficiaryKind', 'default')} />
              <span><strong>{defaultBeneficiary.name}</strong> (default)<br /><span className="muted">Gozo&apos;s only charitable rescue for dogs and cats, since 1976. <a href={defaultBeneficiary.url} target="_blank" rel="noreferrer">gozo-spca.org</a></span></span></label>
            <label className="radio"><input type="radio" name="b" checked={s.beneficiaryKind === 'charity'} onChange={() => upd('beneficiaryKind', 'charity')} />
              <span><strong>A charity of my choice</strong><br /><span className="muted">Any cause you like.</span></span></label>
            <label className="radio"><input type="radio" name="b" checked={s.beneficiaryKind === 'self'} onChange={() => upd('beneficiaryKind', 'self')} />
              <span><strong>Me</strong><br /><span className="muted">Having a rough patch and need the money? It&apos;s yours. No judgement.</span></span></label>
          </div>
          {s.beneficiaryKind === 'charity' && (
            <div className="two">
              <div className="field"><label htmlFor="bn">Charity name</label><input id="bn" type="text" value={s.beneficiaryName ?? ''} onChange={e => upd('beneficiaryName', e.target.value)} required /></div>
              <div className="field"><label htmlFor="bu">Website</label><input id="bu" type="url" value={s.beneficiaryUrl ?? ''} onChange={e => upd('beneficiaryUrl', e.target.value)} placeholder="https://" /></div>
            </div>
          )}
          <div className="field" style={{ maxWidth: 220 }}>
            <label htmlFor="cur">Currency</label>
            <select id="cur" value={s.currency} onChange={e => upd('currency', e.target.value)}>
              {['EUR', 'GBP', 'USD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CAD', 'AUD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>The brain</legend>
          <div className="radio-row" role="radiogroup" aria-label="AI provider">
            {PROVIDERS.map(p => (
              <label className="radio" key={p.v}>
                <input type="radio" name="p" checked={s.aiProvider === p.v} onChange={() => upd('aiProvider', p.v as Settings['aiProvider'])} />
                <span><strong>{p.label}</strong><br /><span className="muted">{p.v === 'server' ? (shared ? `${shared.provider} / ${shared.model}. ${shared.limit} free verdicts a day.` : 'Not available on this server: bring your own key.') : p.hint}</span></span>
              </label>
            ))}
          </div>
          {s.aiProvider !== 'server' && (
            <>
              <div className="field">
                <label htmlFor="key">API key</label>
                <span className="hint">Encrypted with AES-256 before it is stored. Never shown again in full.{keyHint ? ` Current: ${keyHint}` : ''}</span>
                <input id="key" type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder={keyHint ? 'Leave blank to keep the current key' : 'Paste your key'} />
                {keyHint && <label className="check"><input type="checkbox" checked={clearKey} onChange={e => setClearKey(e.target.checked)} /> <span>Remove my stored key</span></label>}
              </div>
              <div className="two">
                <div className="field"><label htmlFor="model">Model (optional)</label><input id="model" type="text" value={s.aiModel ?? ''} onChange={e => upd('aiModel', e.target.value)} placeholder="Leave blank for the default" /></div>
                {s.aiProvider === 'openai-compatible' && <div className="field"><label htmlFor="base">Base URL</label><input id="base" type="url" value={s.aiBaseUrl ?? ''} onChange={e => upd('aiBaseUrl', e.target.value)} placeholder="http://localhost:11434/v1" /></div>}
              </div>
            </>
          )}
        </fieldset>

        <div className="actions-row">
          <button className="btn" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save settings'}</button>
          {state === 'saved' && <span className="saved">Saved.</span>}
          {state === 'error' && <span className="error">{msg}</span>}
        </div>
      </form>

      <fieldset className="fieldset">
        <legend>Your data</legend>
        <p style={{ margin: 0 }}>Signed in as <strong>{email ?? 'you'}</strong>. Your profile, API key and photos are encrypted at rest. See the <a href="/privacy">privacy notice</a>.</p>
        <div className="actions-row"><a className="btn ghost sm" href="/api/me/export">Download everything (JSON)</a></div>
        <div className="field">
          <label htmlFor="del">Delete my account and everything in it</label>
          <span className="hint">Profile, settings, every item and every photo. This cannot be undone. Type DELETE to confirm.</span>
          <div className="actions-row">
            <input id="del" type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} style={{ maxWidth: 200 }} />
            <button className="btn sm danger" type="button" disabled={confirmText !== 'DELETE'} onClick={del}>Delete everything</button>
          </div>
          {msg && state !== 'error' && <span className="error">{msg}</span>}
        </div>
      </fieldset>
    </div>
  );
}
