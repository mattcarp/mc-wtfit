#!/usr/bin/env node
// Visual eval: send real photos through the full app (codes read like the browser does, then /api/analyze)
// and score the answers against what is actually in each photo.
//
//   BASE=http://localhost:3000 node tests/visual_eval/run.mjs            # all cases
//   BASE=http://localhost:3000 node tests/visual_eval/run.mjs bulb-pile  # one case
//
// The server must run with AUTH_MODE=local and a real model (SERVER_AI_* or your key in Settings).
// Each run leaves items in the local owner's ledger; results are also written to tests/visual_eval/last-run.json.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

const here = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://localhost:3000';
const only = process.argv[2];

const wasmPath = join(dirname(createRequire(import.meta.url).resolve('zxing-wasm/reader')), 'zxing_reader.wasm');
prepareZXingModule({ overrides: { wasmBinary: (await readFile(wasmPath)).buffer }, fireImmediately: true });

async function detect(buf) {
  const res = await readBarcodes(new Uint8Array(buf), { tryHarder: true, maxNumberOfSymbols: 6 });
  return res.filter(r => r.isValid && r.text).map(r => ({ format: r.format, text: r.text }));
}

const cases = JSON.parse(await readFile(join(here, 'cases.json'), 'utf8')).filter(c => !only || c.id === only);
const report = [];
let totalItems = 0, foundItems = 0, casesPassed = 0;

for (const c of cases) {
  const form = new FormData(); const codes = [];
  for (const p of c.photos) {
    const buf = await readFile(join(here, p));
    codes.push(...await detect(buf));
    form.append('photo', new Blob([buf], { type: 'image/jpeg' }), 'photo.jpg');
  }
  if (codes.length) form.append('codes', JSON.stringify(codes));
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/analyze`, { method: 'POST', body: form });
  const data = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  const ms = Date.now() - t0;
  if (!r.ok) { console.log(`\n${c.id}: ERROR ${data.error}`); report.push({ id: c.id, error: data.error }); continue; }

  // Score against everything the app said: the verdict (all fields, including any per-item list) and code facts.
  const said = JSON.stringify({ v: data.verdict, facts: data.codeFacts }).toLowerCase();
  const items = c.items.map(it => ({ name: it.name, found: it.match.every(rx => new RegExp(rx, 'i').test(said)) }));
  const found = items.filter(i => i.found).length;
  const verdict = data.verdict.verdict;
  const verdictOk = !c.expectVerdict || c.expectVerdict.includes(verdict);
  const banned = (c.never || []).filter(w => w === verdict || new RegExp(`\\b${w}\\b`, 'i').test(said));
  const pass = found === items.length && verdictOk && banned.length === 0;
  totalItems += items.length; foundItems += found; if (pass) casesPassed++;

  console.log(`\n${pass ? 'PASS' : 'FAIL'}  ${c.id}   ${found}/${items.length} items   verdict ${verdict}${verdictOk ? '' : ' (unexpected)'}   ${ms} ms   ${data.model}`);
  console.log(`      said: ${data.verdict.name}`);
  if (codes.length) console.log(`      codes: ${codes.map(x => `${x.format} ${x.text.startsWith('MT:') ? 'MT:…' : x.text}`).join(', ')}`);
  for (const i of items) console.log(`      ${i.found ? '+' : '-'} ${i.name}`);
  if (banned.length) console.log(`      ! should never say: ${banned.join(', ')}`);
  report.push({ id: c.id, pass, found, of: items.length, verdict, ms, model: data.model, items, name: data.verdict.name, codes });
}

console.log(`\n${casesPassed}/${cases.length} cases pass, ${foundItems}/${totalItems} items found.`);
await writeFile(join(here, 'last-run.json'), JSON.stringify({ at: new Date().toISOString(), base: BASE, report }, null, 2));
process.exit(casesPassed === cases.length ? 0 : 1);
