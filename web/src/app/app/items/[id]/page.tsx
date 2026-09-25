import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { NotConfigured } from '@/components/NotConfigured';
import { VerdictTag } from '@/components/VerdictTag';
import type { Verdict } from '@/lib/ai';
import { getItem, money } from '@/lib/data';
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
                <p className="muted" style={{ fontSize: 14 }}>Category: {v.listing.categoryHint}. Post it on eBay, Facebook Marketplace or your local equivalent, then mark it sold below.</p>
              </section>
            )}
            <ItemActions id={item.id} status={item.status} verdict={item.verdict} currency={item.currency} listingText={listingText} beneficiary={beneficiary} soldAmount={item.sold_amount ? Number(item.sold_amount) : null} />
          </div>
        </div>
      </main>
    </>
  );
}
