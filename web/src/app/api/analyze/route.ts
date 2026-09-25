import { randomUUID } from 'node:crypto';
import { sql } from '@/lib/db';
import { analyzePhoto, buildContext, chooseModel, NoModelError } from '@/lib/ai';
import { beneficiaryLabel, getProfile, getSettings, listItems } from '@/lib/data';
import { deletePhoto, savePhoto } from '@/lib/storage';
import { limited } from '@/lib/ratelimit';
import { fail, json, withUser } from '../_util';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

export async function POST(req: Request) {
  return withUser(async user => {
    if (limited(`an:${user.id}`, 20, 10 * 60 * 1000)) return fail('Slow down: that is a lot of stuff. Try again in a few minutes.', 429);
    let file: File | null = null;
    try { file = (await req.formData()).get('photo') as File | null; } catch { return fail('Send the photo as multipart form data, field "photo".'); }
    if (!file || typeof file === 'string') return fail('No photo attached.');
    if (file.size > MAX_BYTES) return fail('That photo is over 10 MB. The app shrinks photos for you; try again from the camera screen.');
    const mime = file.type || 'image/jpeg';
    if (!OK_TYPES.has(mime)) return fail(`Unsupported image type ${mime}.`);
    const image = Buffer.from(await file.arrayBuffer());

    const settings = await getSettings(user.id);
    let choice;
    try { choice = chooseModel(settings); } catch (e) { return fail((e as Error).message, 400); }

    if (choice.server) {
      const cap = Number(process.env.SERVER_AI_DAILY_LIMIT || 10);
      const [u] = await sql`update users set
          server_ai_count = case when server_ai_day = current_date then server_ai_count + 1 else 1 end,
          server_ai_day = current_date
        where id = ${user.id} returning server_ai_count`;
      if (u.server_ai_count > cap) {
        await sql`update users set server_ai_count = server_ai_count - 1 where id = ${user.id}`;
        return fail(`You've used today's ${cap} free verdicts on the shared model. Add your own API key in Settings for unlimited, or come back tomorrow.`, 429);
      }
    }

    const [{ profile }, inventory] = await Promise.all([getProfile(user.id), listItems(user.id, 80)]);
    const beneficiary = beneficiaryLabel(settings);
    const context = buildContext({ profile, inventory, beneficiary: beneficiary === 'you' ? 'the owner themselves' : beneficiary, currency: settings.currency });

    const id = randomUUID();
    const photoPath = await savePhoto(user.id, id, image);
    try {
      const v = await analyzePhoto({ image, mime, context, choice });
      const [item] = await sql`insert into items ${sql({
        id, user_id: user.id, photo_path: photoPath, photo_mime: mime,
        name: v.name, category: v.category, era: v.era, confidence: v.confidence,
        value_low: v.valueLow, value_high: v.valueHigh, currency: settings.currency,
        verdict: v.verdict, headline: v.headline, reason: v.reason,
        result: sql.json(v as never), model: choice.label, beneficiary_label: beneficiary,
      })} returning id, verdict`;
      return json({ id: item.id, verdict: v, model: choice.label, beneficiary });
    } catch (e) {
      await deletePhoto(photoPath);
      if (choice.server) await sql`update users set server_ai_count = greatest(server_ai_count - 1, 0) where id = ${user.id}`;
      if (e instanceof NoModelError) return fail(e.message, 400);
      console.error('[analyze]', e);
      const msg = (e as Error).message || 'unknown error';
      return fail(`The model choked on that one (${msg.slice(0, 200)}). Try another photo, or check your API key in Settings.`, 502);
    }
  });
}
