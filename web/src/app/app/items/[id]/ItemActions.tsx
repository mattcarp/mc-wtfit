'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Payout = { name: string; url: string | null; iban: string | null; bic: string | null; revolut: string | null; wise: string | null; note: string | null };

export function ItemActions(p: { id: string; status: string; verdict: string | null; currency: string; listingText: string; beneficiary: string; soldAmount: number | null;
  market: { label: string; sellUrl: string | null }; payout: Payout | null; proceedsSent: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [amount, setAmount] = useState(p.soldAmount?.toString() ?? '');
  const [copied, setCopied] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);
  const fmt = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: p.currency }).format(n);
  async function sellIt() {
    try { await navigator.clipboard.writeText(p.listingText); } catch {}
    setCopied(true);
    if (p.market.sellUrl) window.open(p.market.sellUrl, '_blank', 'noopener');
    if (p.status === 'new') patch({ status: 'listed' });
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true); setErr(null);
    const r = await fetch(`/api/items/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) { setErr((await r.json().catch(() => ({}))).error || 'Something went wrong'); return; }
    router.refresh();
  }
  async function remove() {
    if (!confirm('Delete this item and its photo?')) return;
    setBusy(true);
    await fetch(`/api/items/${p.id}`, { method: 'DELETE' });
    router.push('/app/stuff'); router.refresh();
  }

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <h2 className="label" style={{ margin: 0 }}>What actually happened · status: {p.status}</h2>
      {p.listingText && p.status !== 'sold' && (
        <div className="actions-row">
          <button className="btn lime" type="button" onClick={sellIt}>Sell it on {p.market.label} →</button>
          {copied && <span className="saved">Listing copied. Paste it in.</span>}
        </div>
      )}
      {p.status === 'sold' && p.payout && p.soldAmount != null && (
        <div className="callout" style={{ background: p.proceedsSent ? '#fff' : '#D4FF3F' }}>
          <strong>{p.proceedsSent ? 'Sent. Good human.' : `Send ${fmt(p.soldAmount)} to ${p.payout.name}`}</strong>
          {!p.proceedsSent && (
            <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
              {p.payout.iban && (
                <div className="actions-row">
                  <span className="mono" style={{ fontSize: 14 }}>IBAN {p.payout.iban}{p.payout.bic ? ` · BIC ${p.payout.bic}` : ''}</span>
                  <button className="btn sm ghost" type="button" onClick={async () => { await navigator.clipboard.writeText(p.payout!.iban!.replace(/\s/g, '')); setIbanCopied(true); }}>{ibanCopied ? 'Copied' : 'Copy IBAN'}</button>
                </div>
              )}
              <div className="actions-row">
                {p.payout.revolut && <a className="btn sm" href={p.payout.revolut} target="_blank" rel="noreferrer">Pay with Revolut</a>}
                {p.payout.wise && <a className="btn sm" href={p.payout.wise} target="_blank" rel="noreferrer">Pay with Wise</a>}
                {p.payout.url && <a className="btn sm ghost" href={p.payout.url} target="_blank" rel="noreferrer">Their donate page</a>}
              </div>
              {p.payout.note && <span className="muted" style={{ fontSize: 14 }}>{p.payout.note}</span>}
            </div>
          )}
          <div className="actions-row" style={{ marginTop: 10 }}>
            <button className="btn sm ghost" type="button" disabled={busy} onClick={() => patch({ proceedsSent: !p.proceedsSent })}>{p.proceedsSent ? 'Undo' : "I've sent it"}</button>
          </div>
        </div>
      )}
      <div className="actions-row">
        {p.listingText && <button className="btn sm ghost" type="button" onClick={async () => { await navigator.clipboard.writeText(p.listingText); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? 'Copied' : 'Copy listing'}</button>}
        <button className="btn sm ghost" disabled={busy} onClick={() => patch({ status: 'kept' })}>I kept it</button>
        <button className="btn sm ghost" disabled={busy} onClick={() => patch({ status: 'listed' })}>It&apos;s listed</button>
        <button className="btn sm ghost" disabled={busy} onClick={() => patch({ status: 'donated' })}>Gave it away</button>
        <button className="btn sm ghost" disabled={busy} onClick={() => patch({ status: 'discarded' })}>Binned it</button>
      </div>
      <form className="actions-row" onSubmit={e => { e.preventDefault(); patch({ status: 'sold', soldAmount: Number(amount) }); }}>
        <div className="field" style={{ width: 160 }}>
          <label htmlFor="sold">Sold for ({p.currency})</label>
          <input id="sold" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <button className="btn sm lime" style={{ alignSelf: 'end' }} disabled={busy}>Mark sold{p.beneficiary !== 'you' ? ` for ${p.beneficiary}` : ''}</button>
      </form>
      <div className="actions-row">
        <label className="label" htmlFor="ov">Disagree with the verdict?</label>
        <select id="ov" defaultValue={p.verdict ?? ''} onChange={e => patch({ verdict: e.target.value })} disabled={busy} style={{ minHeight: 40, border: '1.5px solid #0A0A0B', padding: '0 8px', background: '#fff' }}>
          <option value="keep">Keep</option><option value="build">Build</option><option value="let_go">Let it go</option><option value="retake">Retake</option>
        </select>
        <button className="btn sm danger" type="button" onClick={remove} disabled={busy}>Delete item</button>
      </div>
      {err && <div className="error">{err}</div>}
    </section>
  );
}
