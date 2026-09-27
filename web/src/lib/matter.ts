import 'server-only';

// Matter onboarding payloads ("MT:..." QR codes) carry the vendor ID and product ID.
// We decode them locally, then look the product up in the public CSA Distributed Compliance Ledger.

import { decodeMatterQr, type MatterPayload } from './matter-core';

export type MatterLookup = MatterPayload & { vendorName?: string; productName?: string; partNumber?: string; vendorUrl?: string };

const DCL = 'https://on.dcl.csa-iot.org/dcl';

async function getJson(url: string): Promise<any> {
  const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) return null;
  return r.json();
}

/** Decode + registry lookup. Never throws: a missing registry entry just means less detail. */
export async function lookupMatter(text: string): Promise<MatterLookup | null> {
  const p = decodeMatterQr(text);
  if (!p) return null;
  const out: MatterLookup = { ...p };
  try {
    const [vendor, model] = await Promise.all([
      getJson(`${DCL}/vendorinfo/vendors/${p.vendorId}`),
      getJson(`${DCL}/model/models/${p.vendorId}/${p.productId}`),
    ]);
    if (vendor?.vendorInfo) { out.vendorName = vendor.vendorInfo.vendorName || vendor.vendorInfo.companyLegalName; out.vendorUrl = vendor.vendorInfo.vendorLandingPageURL || undefined; }
    if (model?.model) { out.productName = model.model.productName || model.model.productLabel; out.partNumber = model.model.partNumber || undefined; }
  } catch { /* offline registry: keep the IDs */ }
  return out;
}

/** Turn decoded codes into plain-English facts for the model. */
export async function describeCodes(codes: { format: string; text: string }[]): Promise<string[]> {
  const facts: string[] = [];
  for (const c of codes.slice(0, 6)) {
    const text = c.text.slice(0, 300);
    const matter = await lookupMatter(text);
    if (matter) {
      const hex = (n: number) => `0x${n.toString(16).toUpperCase().padStart(4, '0')}`;
      facts.push(`Matter pairing QR code decoded: vendor ${matter.vendorName ?? 'unknown'} (ID ${matter.vendorId} / ${hex(matter.vendorId)}), product ${matter.productName ?? 'not in registry'} (ID ${matter.productId}${matter.partNumber ? `, part ${matter.partNumber}` : ''}). Source: official CSA Matter registry.`);
      continue;
    }
    if (/^X-HM:\/\//i.test(text)) { facts.push('HomeKit setup code found: this is an Apple HomeKit-compatible smart-home accessory.'); continue; }
    if (/^WIFI:/i.test(text)) { facts.push('A Wi-Fi setup QR code was found (network credentials not shown).'); continue; }
    if (/^https?:\/\//i.test(text)) { facts.push(`QR code links to: ${text.replace(/[?#].*$/, '')}`); continue; }
    if (/^X00[0-9A-Z]{7}$/.test(text)) { facts.push(`Amazon fulfilment label (FNSKU ${text}): this was bought on Amazon; the printed label text usually names the product.`); continue; }
    if (/^\d{13}$/.test(text) || /^\d{12}$/.test(text)) { facts.push(`Retail product barcode (${text.length === 13 ? 'EAN-13' : 'UPC-A'} ${text}).`); continue; }
    facts.push(`${c.format || 'Barcode'}: ${text}`);
  }
  return facts;
}
