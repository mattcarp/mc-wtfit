// Pure Matter QR payload decoding (no server deps) so it can be unit-tested.
// Spec: Matter Core Specification §5.1.3 (QR code format), base38 encoding §5.1.3.1.

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-.';

export function base38Decode(s: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < s.length; ) {
    const left = s.length - i;
    const chunkLen = left >= 5 ? 5 : left === 4 ? 4 : left === 2 ? 2 : -1;
    if (chunkLen < 0) throw new Error('bad base38 length');
    const bytes = chunkLen === 5 ? 3 : chunkLen === 4 ? 2 : 1;
    let value = 0;
    for (let j = chunkLen - 1; j >= 0; j--) {
      const idx = ALPHABET.indexOf(s[i + j]);
      if (idx < 0) throw new Error('bad base38 char');
      value = value * 38 + idx;
    }
    for (let b = 0; b < bytes; b++) { out.push(value & 0xff); value = Math.floor(value / 256); }
    i += chunkLen;
  }
  return new Uint8Array(out);
}

function readBits(buf: Uint8Array, offset: number, count: number): number {
  let v = 0;
  for (let i = 0; i < count; i++) {
    const bit = offset + i;
    if ((buf[bit >> 3] >> (bit & 7)) & 1) v += 2 ** i;
  }
  return v;
}

export type MatterPayload = { version: number; vendorId: number; productId: number; discriminator: number };

export function decodeMatterQr(text: string): MatterPayload | null {
  const m = text.trim().toUpperCase().match(/^MT:([0-9A-Z\-.]+)/);
  if (!m) return null;
  try {
    const buf = base38Decode(m[1].split('*')[0]);
    if (buf.length < 11) return null;
    const version = readBits(buf, 0, 3);
    const vendorId = readBits(buf, 3, 16);
    const productId = readBits(buf, 19, 16);
    const discriminator = readBits(buf, 45, 12);
    if (version !== 0) return null;
    return { version, vendorId, productId, discriminator };
  } catch { return null; }
}

