import { randomUUID } from 'node:crypto';
import { sql } from '@/lib/db';
import { analyzePhoto, buildContext, chooseModel, NoModelError } from '@/lib/ai';
import { beneficiaryLabel, getProfile, getSettings, listItems } from '@/lib/data';
import { deletePhoto, savePhoto } from '@/lib/storage';
import { limited } from '@/lib/ratelimit';
import { describeCodes } from '@/lib/matter';
import { fail, json, withUser } from '../_util';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;
const OK_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

export async function POST(req: Request) {
  return withUser(async user => {
    if (limited(`an:${user.id}`, 20, 10 * 60 * 1000)) return fail('Slow down: that is a lot of stuff. Try again in a few minutes.', 429);
    let form: FormData;
    try { form = await req.formData(); } catch { return fail('Send the photo as multipart form data, field "photo".'); }
    const files = form.getAll('photo').filter((f): f is File => typeof f !== 'string').slice(0, 3);
    if (!files.length) return fail('No photo attached.');
    const images: { data: Buffer; mime: string }[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) return fail('One of those photos is over 10 MB. The app shrinks photos for you; try again from the scan screen.');
      const mime = file.type || 'image/jpeg';
      if (!OK_TYPES.has(mime)) return fail(`Unsupported image type ${mime}.`);
      images.push({ data: Buffer.from(await file.arrayBuffer()), mime });
    }
    let codes: { format: string; text: string }[] = [];
    try { const raw = form.get('codes'); if (typeof raw === 'string') codes = (JSON.parse(raw) as { format: string; text: string }[]).filter(c => c && typeof c.text === 'string').slice(0, 6); } catch {}
    const codeFacts = await describeCodes(codes);

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
    const photoPath = await savePhoto(user.id, id, images[0].data);
    const extra: string[] = [];
    for (let n = 1; n < images.length; n++) extra.push(await savePhoto(user.id, `${id}-${n}`, images[n].data));
    try {
      const v = await analyzePhoto({ images, context, codeFacts, choice });
      const [item] = await sql`insert into items ${sql({
        id, user_id: user.id, photo_path: photoPath, photo_mime: images[0].mime, extra_photos: extra,
        codes: codes.length ? sql.json({ codes: codes.map(c => ({ format: c.format, text: /^MT:/i.test(c.text) ? 'MT:…' : c.text.slice(0, 200) })), facts: codeFacts } as never) : null,
        name: v.name, category: v.category, era: v.era, confidence: v.confidence,
        value_low: v.valueLow, value_high: v.valueHigh, currency: settings.currency,
        verdict: v.verdict, headline: v.headline, reason: v.reason,
        result: sql.json(v as never), model: choice.label, beneficiary_label: beneficiary,
      })} returning id, verdict`;
      return json({ id: item.id, verdict: v, model: choice.label, beneficiary, codeFacts, photos: images.length });
    } catch (e) {
      await deletePhoto(photoPath);
      for (const p of extra) await deletePhoto(p);
      if (choice.server) await sql`update users set server_ai_count = greatest(server_ai_count - 1, 0) where id = ${user.id}`;
      if (e instanceof NoModelError) return fail(e.message, 400);
      console.error('[analyze]', e);
      const msg = (e as Error).message || 'unknown error';
      return fail(`The model choked on that one (${msg.slice(0, 200)}). Try another photo, or check your API key in Settings.`, 502);
    }
  });
}
