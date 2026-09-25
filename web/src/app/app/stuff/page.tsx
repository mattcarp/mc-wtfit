import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { NotConfigured } from '@/components/NotConfigured';
import { VERDICT_WORD } from '@/components/VerdictTag';
import { beneficiaryLabel, getSettings, listItems, money, valueRange } from '@/lib/data';
import { pageUser } from '@/lib/page';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your stuff' };

const STATUS: Record<string, string> = { new: '—', kept: 'Kept', listed: 'Listed', sold: 'Sold', donated: 'Donated', discarded: 'Binned' };

export default async function StuffPage() {
  const user = await pageUser('/app/stuff');
  if (!user) return <><AppHeader current="/app/stuff" /><NotConfigured /></>;
  const [items, settings] = await Promise.all([listItems(user.id), getSettings(user.id)]);
  const sold = items.filter(i => i.status === 'sold');
  const raised = sold.reduce((s, i) => s + Number(i.sold_amount || 0), 0);
  const letGo = items.filter(i => i.verdict === 'let_go').length;
  const potential = items.filter(i => i.verdict === 'let_go' && i.status !== 'sold').reduce((s, i) => s + Number(i.value_low || 0), 0);
  const who = beneficiaryLabel(settings);
  return (
    <>
      <AppHeader current="/app/stuff" />
      <main className="wrap app-main">
        <h1 className="display page-title">Your thing.</h1>
        <div className="stats">
          <div><span className="label">Items</span><strong>{items.length}</strong></div>
          <div><span className="label">Let go</span><strong>{letGo}</strong></div>
          <div><span className="label">Waiting to sell (at least)</span><strong>{money(potential, settings.currency)}</strong></div>
          <div><span className="label">Raised for {who}</span><strong>{money(raised, settings.currency)}</strong></div>
        </div>
        {items.length === 0 ? (
          <div className="empty"><p className="display" style={{ fontSize: 40 }}>No thing yet.</p><p>Go. Find weird thing in drawer.</p><Link className="btn" href="/app">Scan thing</Link></div>
        ) : (
          <div className="ledger-wrap">
            <table className="ledger">
              <thead><tr><th scope="col"><span className="sr-only">Photo</span></th><th scope="col">Item</th><th scope="col">Confidence</th><th scope="col">Est. value</th><th scope="col">Verdict</th><th scope="col">Status</th><th scope="col">Added</th></tr></thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id}>
                    <td>{i.photo_path ? <img className="thumb" src={`/api/photos/${i.id}`} alt="" loading="lazy" /> : null}</td>
                    <td><Link href={`/app/items/${i.id}`}>{i.name || 'Unknown'}</Link><div className="muted" style={{ fontSize: 13 }}>{i.headline}</div></td>
                    <td className="num">{i.confidence ?? '—'}%</td>
                    <td className="num">{valueRange(i)}</td>
                    <td>{i.verdict && <span className={`chip ${i.verdict}`}>{VERDICT_WORD[i.verdict]}</span>}</td>
                    <td className="num">{i.status === 'sold' ? `Sold ${money(i.sold_amount, i.currency)}` : STATUS[i.status]}</td>
                    <td className="num">{new Date(i.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
