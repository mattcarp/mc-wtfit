import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM. Layout: [version=1][12-byte IV][16-byte tag][ciphertext]
const VERSION = 1;

function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY is not set (32 random bytes, base64). Generate one with: openssl rand -base64 32');
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new Error('ENCRYPTION_KEY must decode to exactly 32 bytes');
  return k;
}

export function encrypt(plain: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([Buffer.from([VERSION]), iv, c.getAuthTag(), body]);
}

export function decrypt(blob: Buffer): Buffer {
  if (blob[0] !== VERSION) throw new Error('Unknown ciphertext version');
  const iv = blob.subarray(1, 13);
  const tag = blob.subarray(13, 29);
  const d = createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(blob.subarray(29)), d.final()]);
}

export const encryptString = (s: string) => encrypt(Buffer.from(s, 'utf8')).toString('base64');
export const decryptString = (s: string) => decrypt(Buffer.from(s, 'base64')).toString('utf8');
