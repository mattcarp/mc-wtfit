// Guardrail tests for the verdict normalizer (run: node --test web/tests/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Extract normalize() from ai.ts without pulling in server-only deps.
const src = readFileSync(new URL('../src/lib/ai.ts', import.meta.url), 'utf8');
const body = src.slice(src.indexOf('export function normalize'));
const fn = body.slice(0, body.indexOf('\n}\n') + 2).replace('export function normalize(v: Verdict): Verdict', 'function normalize(v)');
const normalize = new Function(`${fn}; return normalize;`)();

const base = { identified: true, confidence: 90, valueLow: 5, valueHigh: 10, verdict: 'let_go', mightBeOnlyOne: false, pairsWith: [], hasStorageOrAccount: false, wipeChecklist: [], listing: { title: 'x' }, retakeTip: null, jobInYourLife: null, reason: 'r' };

test('low confidence becomes retake, never a sale', () => {
  const v = normalize({ ...base, confidence: 40 });
  assert.equal(v.verdict, 'retake'); assert.equal(v.listing, null); assert.ok(v.retakeTip);
});
test('charger for nothing they own stays let_go', () => {
  assert.equal(normalize({ ...base, mightBeOnlyOne: true, pairsWith: [] }).verdict, 'let_go');
});
test('charger for something they own is kept, with the reason', () => {
  const v = normalize({ ...base, mightBeOnlyOne: true, pairsWith: ['ThinkPad X1'] });
  assert.equal(v.verdict, 'keep'); assert.match(v.reason, /ThinkPad X1/); assert.equal(v.listing, null);
});
test('swapped value range is fixed', () => {
  const v = normalize({ ...base, valueLow: 20, valueHigh: 5 });
  assert.deepEqual([v.valueLow, v.valueHigh], [5, 20]);
});
test('pile: unsure items become retake, value is the sum, a pile of one is not a pile', () => {
  const it = (o) => ({ name: 'x', count: 1, evidence: 'e', confidence: 90, verdict: 'let_go', reason: 'r', valueLow: 1, valueHigh: 2, powerPort: null, ...o });
  const v = normalize({ ...base, pile: [it({ valueLow: 10, valueHigh: 20 }), it({ confidence: 30 }), it({ valueLow: 5, valueHigh: 3 })] });
  assert.equal(v.pile[1].verdict, 'retake');
  assert.deepEqual([v.valueLow, v.valueHigh], [14, 27]);
  assert.equal(normalize({ ...base, pile: [it({})] }).pile.length, 0);
});
