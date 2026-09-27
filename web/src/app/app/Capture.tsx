'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Verdict } from '@/lib/ai';
import { VerdictTag } from '@/components/VerdictTag';
import { detectCodes } from '@/lib/codes-client';

type Result = { id: string; verdict: Verdict; model: string; beneficiary: string; codeFacts?: string[]; photos?: number };

const MAX_PHOTOS = 3;

async function shrink(file: Blob): Promise<Blob> {
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

const LINES = ['Squinting at it…', 'Reading the small print…', 'Checking your drawers, metaphorically…', 'Cross-referencing your life choices…', 'Consulting the fondue council…', 'Deciding its fate…'];

const imagesFrom = (list: FileList | File[] | null | undefined) =>
  Array.from(list ?? []).filter(f => f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp)$/i.test(f.name));

export function Capture({ currency, beneficiary }: { currency: string; beneficiary: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [touch, setTouch] = useState(true);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [line, setLine] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => { setTouch(window.matchMedia('(pointer: coarse)').matches); }, []);

  const judge = useCallback(async (incoming: File[], opts: { append?: boolean } = {}) => {
    const all = (opts.append ? [...files, ...incoming] : incoming).slice(0, MAX_PHOTOS);
    if (!all.length) return;
    const replacing = opts.append ? result?.id : undefined;
    setError(null); setResult(null); setBusy(true); setFiles(all);
    setPreviews(all.map(f => URL.createObjectURL(f)));
    let i = 0; setLine('Reading barcodes and QR codes…');
    const t = setInterval(() => { setLine(LINES[i % LINES.length]); i++; }, 2200);
    try {
      const codes = await detectCodes(all);
      const body = new FormData();
      for (const f of all) body.append('photo', await shrink(f), 'photo.jpg');
      if (codes.length) body.append('codes', JSON.stringify(codes));
      const r = await fetch('/api/analyze', { method: 'POST', body });
      const data = await r.json().catch(() => ({ error: `Server said ${r.status}` }));
      if (!r.ok) throw new Error(data.error || `Server said ${r.status}`);
      setResult(data);
      if (replacing) fetch(`/api/items/${replacing}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) { setError((e as Error).message); }
    finally { clearInterval(t); setBusy(false); setLine(''); if (input.current) input.current.value = ''; }
  }, [files, result]);

  // Paste a photo from the clipboard (Cmd+V / Ctrl+V), e.g. one AirDropped from your phone.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (busy) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const pasted = imagesFrom(Array.from(e.clipboardData?.items ?? []).map(it => it.getAsFile()).filter((f): f is File => !!f));
      if (pasted.length) { e.preventDefault(); judge(pasted); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [busy, judge]);

  const hint = touch ? 'Tap to take a photo' : 'Click, drop, or paste (⌘V) up to 3 photos';
  const addingAngle = useRef(false);

  return (
    <div className="capture">
      <div>
        <button type="button" className={`shutter${busy ? ' scanning' : ''}${dragging ? ' dragging' : ''}`}
          onClick={() => { addingAngle.current = false; input.current?.click(); }} disabled={busy} aria-label="Take, choose, drop or paste a photo"
          onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) judge(imagesFrom(e.dataTransfer.files)); }}>
          <span className="crosshair tl" /><span className="crosshair tr" /><span className="crosshair bl" /><span className="crosshair br" />
          {previews.length > 0 && (
            <span className={`shots n${previews.length}`}>{previews.map((p, n) => <img key={n} src={p} alt="" />)}</span>
          )}
          {!busy && (
            <span className="shutter-btn">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="4" /></svg>
              <span className="display">{dragging ? 'Drop it' : previews.length ? 'Another one' : 'What the fuck this?'}</span>
              <span>{hint}</span>
            </span>
          )}
        </button>
        <input ref={input} type="file" accept="image/*" hidden multiple={!touch} {...(touch ? { capture: 'environment' as const } : {})}
          onChange={e => { const f = imagesFrom(e.target.files); judge(f, { append: addingAngle.current }); addingAngle.current = false; }} />
        <div className="status-line" aria-live="polite">{busy ? line : ''}</div>
        {result && files.length < MAX_PHOTOS && !busy && (
          <p style={{ margin: '4px 0 0' }}>
            <button type="button" className="btn sm ghost" onClick={() => { addingAngle.current = true; input.current?.click(); }}>
              + Add another angle{result.verdict.verdict === 'retake' ? ' (the label, the QR code)' : ''}
            </button>
          </p>
        )}
        {error && <div className="error" role="alert">{error}{/Settings/.test(error) && <> <Link href="/app/settings">Open Settings</Link></>}</div>}
      </div>
      <div>
        {result ? (
          <>
            <VerdictTag v={result.verdict} currency={currency} beneficiary={result.beneficiary} evidenceNo={result.id.slice(0, 4).toUpperCase()}
              footer={<Link className="btn sm ghost" href={`/app/items/${result.id}`}>Details</Link>} />
            {!!result.codeFacts?.length && (
              <div className="callout" style={{ marginTop: 16 }}>
                <strong>Read from the codes</strong>
                <ul>{result.codeFacts.map((f, n) => <li key={n}>{f}</li>)}</ul>
              </div>
            )}
          </>
        ) : (
          <div className="notice">
            <p className="label" style={{ marginTop: 0 }}>How it works</p>
            <p style={{ margin: '0 0 8px' }}>Point, shoot, done. No typing. WTF This reads any labels, barcodes and QR codes, checks the thing against your profile and your stuff, and gives one verdict: <strong>keep</strong>, <strong>build</strong>, <strong>let it go</strong> or <strong>retake</strong>.</p>
            {!touch && <p style={{ margin: '0 0 8px' }}>On a computer: AirDrop or copy photos from your phone, then drop them here or press <strong>⌘V</strong>. Up to three photos of the same thing (front, label, QR code) are judged together.</p>}
            <p className="muted" style={{ margin: 0 }}>Anything you let go gets a ready-made listing, and the money goes to {beneficiary === 'you' ? 'you' : beneficiary}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
