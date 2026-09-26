import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { NotConfigured } from '@/components/NotConfigured';
import { VerdictTag } from '@/components/VerdictTag';
import type { Verdict } from '@/lib/ai';
import { getItem, getSettings, money } from '@/lib/data';
import { defaultPayout, formatIban, type Payout } from '@/lib/payout';
import { marketplace } from '@/lib/marketplaces';
import { pageUser } from '@/lib/page';
import { ItemActions } from './ItemActions';

export const dynamic = 'force-dynamic';

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await pageUser(`/app/items/${id}`);
  if (!user) return <><AppHeader current="/app/stuff" /><NotConfigured /></>;
  const item = await getItem(user.id, id);
  if (!item) notFound();
  const v = item.result as Verdict;
  const settings = await getSettings(user.id);
  const payout: Payout | null = item.beneficiary_label === 'you' ? null
    : settings.beneficiaryKind === 'charity'
      ? { name: settings.beneficiaryName || 'your charity', url: settings.beneficiaryUrl, iban: settings.beneficiaryIban ? formatIban(settings.beneficiaryIban) : null, bic: settings.beneficiaryBic, revolut: settings.beneficiaryRevolut, wise: settings.beneficiaryWise, note: null }
      : (() => { const d = defaultPayout(); return { ...d, iban: d.iban ? formatIban(d.iban) : null }; })();
  const market = marketplace(settings.marketplace);
  const beneficiary = item.beneficiary_label || 'Gozo SPCA';
  const listingText = v.listing ? `${v.listing.title}\n\n${v.listing.description}\n\nPrice: ${money(v.listing.suggestedPrice, item.currency)}\n${beneficiary !== 'you' ? `\nAll proceeds go to ${beneficiary}.` : ''}` : '';
  return (
    <>
      <AppHeader current="/app/stuff" />
      <main className="wrap app-main">
        <p className="label"><Link href="/app/stuff">← Your stuff</Link></p>
        <div className="item-grid">
          <div>
            {item.photo_path && <div className="photo-frame"><img src={`/api/photos/${item.id}`} alt={item.name || 'Photo'} /></div>}
            <p className="label" style={{ marginTop: 10 }}>Judged by {item.model} · {new Date(item.created_at).toLocaleString('en-GB')}</p>
          </div>
          <div style={{ display: 'grid', gap: 24 }}>
            <VerdictTag v={v} currency={item.currency} beneficiary={beneficiary} evidenceNo={item.id.slice(0, 4).toUpperCase()} />
            {v.listing && (
              <section>
                <h2 className="label">Ready-to-post listing</h2>
                <pre className="listing">{listingText}</pre>
                <p className="muted" style={{ fontSize: 14 }}>Category: {v.listing.categoryHint}. Tap <strong>Sell it</strong> below: the listing is copied and {market.label} opens, ready to paste. Mark it sold when it goes.</p>
              </section>
            )}
            <ItemActions id={item.id} status={item.status} verdict={item.verdict} currency={item.currency} listingText={listingText} beneficiary={beneficiary} soldAmount={item.sold_amount ? Number(item.sold_amount) : null}
              market={{ label: market.label, sellUrl: market.sellUrl }} payout={payout} proceedsSent={!!item.proceeds_sent_at} />
          </div>
        </div>
      </main>
    </>
  );
}
