import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeMatterQr } from '../src/lib/matter-core.ts';

test('decodes the Matter spec example payload', () => {
  // Example from the Matter spec / connectedhomeip: VID 0xFFF1, PID 0x8000, discriminator 3840
  const p = decodeMatterQr('MT:Y.K9042C00KA0648G00');
  assert.ok(p);
  assert.equal(p!.vendorId, 0xfff1);
  assert.equal(p!.productId, 0x8000);
  assert.equal(p!.discriminator, 3840);
});
test('ignores things that are not Matter codes', () => {
  assert.equal(decodeMatterQr('https://example.com'), null);
  assert.equal(decodeMatterQr('MT:!!!'), null);
});
