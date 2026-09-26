// Payout details: the operator's default beneficiary comes from env (so forks can point at their own charity);
// a user's own choice of charity comes from their settings. Money never flows through WTF This.

export type Payout = { name: string; url: string | null; iban: string | null; bic: string | null; revolut: string | null; wise: string | null; note: string | null };

export function defaultPayout(): Payout {
  return {
    name: process.env.DEFAULT_BENEFICIARY_NAME || 'Gozo SPCA',
    url: process.env.DEFAULT_BENEFICIARY_URL || 'https://gozo-spca.org/',
    iban: process.env.DEFAULT_BENEFICIARY_IBAN || null,
    bic: process.env.DEFAULT_BENEFICIARY_BIC || null,
    revolut: process.env.DEFAULT_BENEFICIARY_REVOLUT || null,
    wise: process.env.DEFAULT_BENEFICIARY_WISE || null,
    note: process.env.DEFAULT_BENEFICIARY_NOTE || null,
  };
}

/** ISO 13616 mod-97 check. Accepts spaces, returns the normalized IBAN or null. */
export function normalizeIban(raw: string): string | null {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return null;
  const moved = s.slice(4) + s.slice(0, 4);
  const digits = moved.replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let rem = 0;
  for (const ch of digits) rem = (rem * 10 + Number(ch)) % 97;
  return rem === 1 ? s : null;
}

export const formatIban = (s: string) => s.replace(/(.{4})/g, '$1 ').trim();
