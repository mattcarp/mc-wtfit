'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import type { Verdict } from '@/lib/ai';
import { VerdictTag } from '@/components/VerdictTag';

type Result = { id: string; verdict: Verdict; model: string; beneficiary: string };

async function shrink(file: File): Promise<Blob> {
  // Resize to max 1600px JPEG: faster uploads, cheaper models, smaller storage. Falls back to the original.
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob ?? file;
  } catch { return file; }
}

const LINES = ['Squinting at it…', 'Checking your drawers, metaphorically…', 'Cross-referencing your life choices…', 'Consulting the fondue council…', 'Deciding its fate…'];

export function Capture({ currency, beneficiary }: { currency: string; beneficiary: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError(null); setResult(null); setBusy(true);
    setPreview(URL.createObjectURL(f));
    let i = 0; setLine(LINES[0]);
    const t = setInterval(() => { i = (i + 1) % LINES.length; setLine(LINES[i]); }, 2200);
    try {
      const body = new FormData();
      body.append('photo', await shrink(f), 'photo.jpg');
      const r = await fetch('/api/analyze', { method: 'POST', body });
      const data = await r.json().catch(() => ({ error: `Server said ${r.status}` }));
      if (!r.ok) throw new Error(data.error || `Server said ${r.status}`);
      setResult(data);
    } catch (e) { setError((e as Error).message); }
    finally { clearInterval(t); setBusy(false); setLine(''); if (input.current) input.current.value = ''; }
  }

  return (
    <div className="capture">
      <div>
        <button type="button" className={`shutter${busy ? ' scanning' : ''}`} onClick={() => input.current?.click()} disabled={busy} aria-label="Take or choose a photo">
          <span className="crosshair tl" /><span className="crosshair tr" /><span className="crosshair bl" /><span className="crosshair br" />
          {preview && <img src={preview} alt="" />}
          {!busy && (
            <span className="shutter-btn">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="4" /></svg>
              <span className="display">{preview ? 'Another one' : 'What the fuck this?'}</span>
              <span>Tap to take a photo</span>
            </span>
          )}
        </button>
        <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={e => onFile(e.target.files?.[0])} />
        <div className="status-line" aria-live="polite">{busy ? line : ''}</div>
        {error && <div className="error" role="alert">{error}{/Settings/.test(error) && <> <Link href="/app/settings">Open Settings</Link></>}</div>}
      </div>
      <div>
        {result ? (
          <VerdictTag v={result.verdict} currency={currency} beneficiary={result.beneficiary} evidenceNo={result.id.slice(0, 4).toUpperCase()}
            footer={<Link className="btn sm ghost" href={`/app/items/${result.id}`}>Details</Link>} />
        ) : (
          <div className="notice">
            <p className="label" style={{ marginTop: 0 }}>How it works</p>
            <p style={{ margin: '0 0 8px' }}>Point, shoot, done. No typing. WTF This works out what it is, checks it against your profile and your stuff, and gives one verdict: <strong>keep</strong>, <strong>build</strong>, <strong>let it go</strong> or <strong>retake</strong>.</p>
            <p className="muted" style={{ margin: 0 }}>Anything you let go gets a ready-made listing, and the money goes to {beneficiary === 'you' ? 'you' : beneficiary}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
