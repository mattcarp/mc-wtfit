import 'server-only';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { decrypt, encrypt } from './crypto';

// Photos are encrypted at rest on a local volume. Swap for S3/R2 later without touching callers.
const root = () => process.env.PHOTO_DIR || join(process.cwd(), 'data', 'photos');
const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function savePhoto(userId: string, itemId: string, data: Buffer): Promise<string> {
  const dir = join(root(), safe(userId));
  await mkdir(dir, { recursive: true });
  const rel = `${safe(userId)}/${safe(itemId)}.bin`;
  await writeFile(join(root(), rel), encrypt(data));
  return rel;
}

export async function readPhoto(rel: string): Promise<Buffer> {
  return decrypt(await readFile(join(root(), rel)));
}

export async function deletePhoto(rel: string) {
  await rm(join(root(), rel), { force: true });
}

export async function deleteUserPhotos(userId: string) {
  await rm(join(root(), safe(userId)), { recursive: true, force: true });
}
