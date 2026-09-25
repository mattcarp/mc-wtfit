import { sql } from '@/lib/db';
import { encryptString } from '@/lib/crypto';
import { getSettings } from '@/lib/data';
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
    const provider = PROVIDERS.has(b.aiProvider) ? b.aiProvider : 'server';
    const model = String(b.aiModel || '').trim().slice(0, 100) || null;
    let baseUrl = provider === 'openai-compatible' ? String(b.aiBaseUrl || '').trim().slice(0, 300) || null : null;
    if (baseUrl && !/^https?:\/\//i.test(baseUrl)) return fail('The base URL should start with http:// or https://');
    const currency = CURRENCIES.has(b.currency) ? b.currency : 'EUR';
    // aiKey: undefined = keep, "" = clear, string = replace
    const keyUpdate = typeof b.aiKey === 'string'
      ? (b.aiKey.trim() ? sql`ai_key_enc = ${encryptString(b.aiKey.trim().slice(0, 400))},` : sql`ai_key_enc = null,`)
      : sql``;
    await sql`update settings set ${keyUpdate}
      beneficiary_kind = ${kind}, beneficiary_name = ${name}, beneficiary_url = ${url},
      ai_provider = ${provider}, ai_model = ${model}, ai_base_url = ${baseUrl}, currency = ${currency}, updated_at = now()
      where user_id = ${u.id}`;
    return json({ ok: true });
  });
}
