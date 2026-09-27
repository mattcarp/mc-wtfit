import type { Verdict } from '@/lib/ai';

export const VERDICT_WORD: Record<string, string> = { keep: 'Keep', build: 'Build', let_go: 'Let it go', retake: 'Retake' };

function money(n: number, currency: string) {
  const whole = Number.isInteger(n);
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
}

function span(lo: number, hi: number, currency: string) {
  return lo === hi ? money(lo, currency) : `${money(lo, currency)}–${money(hi, currency).replace(/^[^\d]+/, '')}`;
}

export function VerdictTag({ v, currency, beneficiary, evidenceNo, footer }: { v: Verdict; currency: string; beneficiary: string; evidenceNo?: string; footer?: React.ReactNode }) {
  const range = span(v.valueLow, v.valueHigh, currency);
  const pile = (v.pile?.length ?? 0) > 1;
  const note = v.verdict === 'let_go'
    ? `Listing written. Once you confirm, the proceeds go to ${beneficiary === 'you' ? 'you' : beneficiary}.`
    : v.verdict === 'retake' ? 'Too unsure to judge. Nothing gets sold on a guess.'
    : v.verdict === 'build' ? 'Saved as an idea in your stuff.' : 'Saved to your inventory.';
  return (
    <article className="tag" aria-label="Verdict">
      <div className="tag-head">
        <span className="label">Evidence{evidenceNo ? ` Nº ${evidenceNo}` : ''}</span>
        <span className="label">{v.category}</span>
      </div>
      <div className="tag-body">
        <h2 className="tag-name">{v.name}</h2>
        <p className="tag-headline">{v.headline}</p>
        <dl className="readout">
          <div className="row"><dt>Era</dt><dd>{v.era}</dd></div>
          <div className="row"><dt>Confidence</dt><dd><span className="num">{v.confidence}%</span><span className="bar" aria-hidden="true"><i style={{ width: `${v.confidence}%` }} /></span></dd></div>
          <div className="row"><dt>Est. value</dt><dd className="num">{range}</dd></div>
          <div className="row"><dt>Condition</dt><dd>{v.condition}</dd></div>
          {!pile && v.powerPort && <div className="row"><dt>Power</dt><dd>{v.powerPort}{v.charger ? ` · needs ${v.charger}` : ''}</dd></div>}
          <div className="row"><dt>Why</dt><dd>{v.reason}</dd></div>
        </dl>
        {pile && (
          <div className="pile" aria-label="What's in the pile">
            <p className="label" style={{ margin: '0 0 6px' }}>{v.pile.length} things in this pile</p>
            <ol>
              {v.pile.map((i, n) => (
                <li key={n}>
                  <div className="pile-main">
                    <span className="pile-name">{i.count > 1 && <span className="num">{i.count}× </span>}{i.name}</span>
                    <span className="pile-meta muted">{i.evidence}{i.powerPort && i.powerPort !== 'not visible' ? ` · ${i.powerPort}` : ''}</span>
                    <span className="pile-reason">{i.reason}</span>
                  </div>
                  <span className="num pile-value">{span(i.valueLow, i.valueHigh, currency)}</span>
                  <span className={`stamp sm ${i.verdict}`}>{VERDICT_WORD[i.verdict]}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {v.jobInYourLife && <div className="callout"><strong>Its job in your life</strong>{v.jobInYourLife}</div>}
        {v.buildIdea && <div className="callout"><strong>Build idea</strong>{v.buildIdea}{v.pairsWith.length > 0 && <div className="muted" style={{ marginTop: 6 }}>Pairs with: {v.pairsWith.join(', ')}</div>}</div>}
        {v.retakeTip && <div className="callout"><strong>Retake</strong>{v.retakeTip}</div>}
        {v.wipeChecklist.length > 0 && <div className="callout"><strong>Wipe before it ships</strong><ul>{v.wipeChecklist.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
      </div>
      <div className="tag-foot">
        <span className={`stamp ${v.verdict}`}>{VERDICT_WORD[v.verdict]}</span>
        <span className="muted" style={{ fontSize: 14, flex: 1, minWidth: 180 }}>{note}</span>
        {footer}
      </div>
    </article>
  );
}
