import 'server-only';
import { sql } from './db';
import { decryptString, encryptString } from './crypto';
import type { RepoSummary } from './github';

export const DEFAULT_BENEFICIARY = { name: 'Gozo SPCA', url: 'https://gozo-spca.org/' } as const;

export type Profile = {
  displayName?: string;
  homes?: string;
  household?: string;
  githubUsername?: string;
  repos?: RepoSummary[];
  reposFetchedAt?: string;
  projects?: string;
  skills?: string;
  hobbies?: string;
  interests?: string;
  habits?: string;
  goals?: string;
  gear?: string;
  anythingElse?: string;
};

export const PROFILE_TEXT_FIELDS = ['displayName', 'homes', 'household', 'projects', 'skills', 'hobbies', 'interests', 'habits', 'goals', 'gear', 'anythingElse'] as const;

export async function getProfile(userId: string): Promise<{ profile: Profile; sensitiveConsentAt: Date | null; updatedAt: Date | null }> {
  const [row] = await sql`select data_enc, sensitive_consent_at, updated_at from profiles where user_id = ${userId}`;
  if (!row) return { profile: {}, sensitiveConsentAt: null, updatedAt: null };
  return { profile: JSON.parse(decryptString(row.data_enc)), sensitiveConsentAt: row.sensitive_consent_at, updatedAt: row.updated_at };
}

export async function saveProfile(userId: string, profile: Profile, sensitiveConsent: boolean) {
  const enc = encryptString(JSON.stringify(profile));
  await sql`insert into profiles (user_id, data_enc, sensitive_consent_at, updated_at)
            values (${userId}, ${enc}, ${sensitiveConsent ? sql`now()` : null}, now())
            on conflict (user_id) do update set data_enc = excluded.data_enc,
              sensitive_consent_at = ${sensitiveConsent ? sql`coalesce(profiles.sensitive_consent_at, now())` : null},
              updated_at = now()`;
}

export type Settings = {
  beneficiaryKind: 'default' | 'charity' | 'self';
  beneficiaryName: string | null;
  beneficiaryUrl: string | null;
  currency: string;
  aiProvider: 'server' | 'anthropic' | 'openai' | 'google' | 'openai-compatible';
  aiModel: string | null;
  aiBaseUrl: string | null;
  hasAiKey: boolean;
};

export async function getSettings(userId: string): Promise<Settings & { aiKey: string | null }> {
  const [r] = await sql`select * from settings where user_id = ${userId}`;
  if (!r) return { beneficiaryKind: 'default', beneficiaryName: null, beneficiaryUrl: null, currency: 'EUR', aiProvider: 'server', aiModel: null, aiBaseUrl: null, hasAiKey: false, aiKey: null };
  return {
    beneficiaryKind: r.beneficiary_kind,
    beneficiaryName: r.beneficiary_name,
    beneficiaryUrl: r.beneficiary_url,
    currency: r.currency,
    aiProvider: r.ai_provider,
    aiModel: r.ai_model,
    aiBaseUrl: r.ai_base_url,
    hasAiKey: !!r.ai_key_enc,
    aiKey: r.ai_key_enc ? decryptString(r.ai_key_enc) : null,
  };
}

export function beneficiaryLabel(s: Pick<Settings, 'beneficiaryKind' | 'beneficiaryName'>): string {
  if (s.beneficiaryKind === 'self') return 'you';
  if (s.beneficiaryKind === 'charity' && s.beneficiaryName) return s.beneficiaryName;
  return DEFAULT_BENEFICIARY.name;
}

export type ItemRow = {
  id: string; name: string | null; category: string | null; era: string | null; confidence: number | null;
  value_low: string | null; value_high: string | null; currency: string; verdict: 'keep' | 'build' | 'let_go' | 'retake' | null;
  headline: string | null; reason: string | null; result: unknown; model: string | null; status: string;
  sold_amount: string | null; beneficiary_label: string | null; created_at: Date; photo_path: string | null; photo_mime: string | null;
};

export async function listItems(userId: string, limit = 200): Promise<ItemRow[]> {
  return (await sql`select * from items where user_id = ${userId} order by created_at desc limit ${limit}`) as unknown as ItemRow[];
}

export async function getItem(userId: string, id: string): Promise<ItemRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [r] = await sql`select * from items where user_id = ${userId} and id = ${id}`;
  return (r as unknown as ItemRow) ?? null;
}

export function money(n: number | string | null | undefined, currency = 'EUR') {
  if (n === null || n === undefined || n === '') return '—';
  const v = Number(n);
  const whole = Number.isInteger(v);
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v);
}

export function valueRange(i: Pick<ItemRow, 'value_low' | 'value_high' | 'currency'>) {
  if (i.value_low == null && i.value_high == null) return '—';
  if (i.value_low === i.value_high || i.value_high == null) return money(i.value_low, i.currency);
  return `${money(i.value_low, i.currency)}–${money(i.value_high, i.currency).replace(/^[^\d]+/, '')}`;
}
