import { sql } from '@/lib/db';
import { encryptString } from '@/lib/crypto';
import { getSettings } from '@/lib/data';
import { normalizeIban } from '@/lib/payout';
import { MARKETPLACES } from '@/lib/marketplaces';
import { fail, json, withUser } from '../_util';

export const dynamic = 'force-dynamic';
const PROVIDERS = new Set(['server', 'anthropic', 'openai', 'google', 'openai-compatible']);
const KINDS = new Set(['default', 'charity', 'self']);
const CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CAD', 'AUD']);

export async function GET() {
  return withUser(async u => { const { aiKey, ...s } = await getSettings(u.id); void aiKey; return json(s); });
}

export async function PUT(req: Request) {
  return withUser(async u => {
    const b = await req.json().catch(() => null);
    if (!b) return fail('Bad request');
    const kind = KINDS.has(b.beneficiaryKind) ? b.beneficiaryKind : 'default';
    const name = kind === 'charity' ? String(b.beneficiaryName || '').trim().slice(0, 120) : null;
    let url = kind === 'charity' ? String(b.beneficiaryUrl || '').trim().slice(0, 300) : null;
    if (kind === 'charity' && !name) return fail('Give your charity a name.');
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    let iban: string | null = null;
    if (kind === 'charity' && String(b.beneficiaryIban || '').trim()) {
      iban = normalizeIban(String(b.beneficiaryIban));
      if (!iban) return fail('That IBAN does not check out. Double-check the digits.');
    }
    const bic = kind === 'charity' ? String(b.beneficiaryBic || '').trim().toUpperCase().slice(0, 11) || null : null;
    if (bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) return fail('That BIC/SWIFT code looks wrong (8 or 11 characters).');
    const link = (v: unknown, host: RegExp, what: string) => {
      const s = String(v || '').trim(); if (!s) return null;
      const u = /^https?:\/\//i.test(s) ? s : `https://${s}`;
      try { const h = new URL(u).hostname; if (!host.test(h)) throw 0; return u.slice(0, 300); } catch { throw new Error(`That doesn't look like a ${what} link.`); }
    };
    let revolut: string | null = null, wise: string | null = null;
    try {
      revolut = kind === 'charity' ? link(b.beneficiaryRevolut, /(^|\.)revolut\.(me|com)$/i, 'Revolut') : null;
      wise = kind === 'charity' ? link(b.beneficiaryWise, /(^|\.)wise\.com$/i, 'Wise') : null;
    } catch (e) { return fail((e as Error).message); }
    const provider = PROVIDERS.has(b.aiProvider) ? b.aiProvider : 'server';
    const model = String(b.aiModel || '').trim().slice(0, 100) || null;
    let baseUrl = provider === 'openai-compatible' ? String(b.aiBaseUrl || '').trim().slice(0, 300) || null : null;
    if (baseUrl && !/^https?:\/\//i.test(baseUrl)) return fail('The base URL should start with http:// or https://');
    const currency = CURRENCIES.has(b.currency) ? b.currency : 'EUR';
    const market = MARKETPLACES.some(m => m.id === b.marketplace) ? b.marketplace : 'ebay.co.uk';
    // aiKey: undefined = keep, "" = clear, string = replace
    const keyUpdate = typeof b.aiKey === 'string'
      ? (b.aiKey.trim() ? sql`ai_key_enc = ${encryptString(b.aiKey.trim().slice(0, 400))},` : sql`ai_key_enc = null,`)
      : sql``;
    await sql`update settings set ${keyUpdate}
      beneficiary_kind = ${kind}, beneficiary_name = ${name}, beneficiary_url = ${url},
      beneficiary_iban = ${iban}, beneficiary_bic = ${bic}, beneficiary_revolut = ${revolut}, beneficiary_wise = ${wise},
      ai_provider = ${provider}, ai_model = ${model}, ai_base_url = ${baseUrl}, currency = ${currency}, marketplace = ${market}, updated_at = now()
      where user_id = ${u.id}`;
    return json({ ok: true });
  });
}
