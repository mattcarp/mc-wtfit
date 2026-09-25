import type { Verdict } from '@/lib/ai';

export const VERDICT_WORD: Record<string, string> = { keep: 'Keep', build: 'Build', let_go: 'Let it go', retake: 'Retake' };

function money(n: number, currency: string) {
  const whole = Number.isInteger(n);
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
}

export function VerdictTag({ v, currency, beneficiary, evidenceNo, footer }: { v: Verdict; currency: string; beneficiary: string; evidenceNo?: string; footer?: React.ReactNode }) {
  const range = v.valueLow === v.valueHigh ? money(v.valueLow, currency) : `${money(v.valueLow, currency)}–${money(v.valueHigh, currency).replace(/^[^\d]+/, '')}`;
  const note = v.verdict === 'let_go'
    ? `Listing written. You say yes, money go to ${beneficiary === 'you' ? 'you' : beneficiary}.`
    : v.verdict === 'retake' ? 'Too unsure. Nothing sold on a guess.'
    : v.verdict === 'build' ? 'Idea saved in your stuff.' : 'Thing saved to your list.';
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
          <div className="row"><dt>Why</dt><dd>{v.reason}</dd></div>
        </dl>
        {v.jobInYourLife && <div className="callout"><strong>Job of thing</strong>{v.jobInYourLife}</div>}
        {v.buildIdea && <div className="callout"><strong>Make new thing</strong>{v.buildIdea}{v.pairsWith.length > 0 && <div className="muted" style={{ marginTop: 6 }}>Pairs with: {v.pairsWith.join(', ')}</div>}</div>}
        {v.retakeTip && <div className="callout"><strong>Retake</strong>{v.retakeTip}</div>}
        {v.wipeChecklist.length > 0 && <div className="callout"><strong>Wipe before go</strong><ul>{v.wipeChecklist.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
      </div>
      <div className="tag-foot">
        <span className={`stamp ${v.verdict}`}>{VERDICT_WORD[v.verdict]}</span>
        <span className="muted" style={{ fontSize: 14, flex: 1, minWidth: 180 }}>{note}</span>
        {footer}
      </div>
    </article>
  );
}
