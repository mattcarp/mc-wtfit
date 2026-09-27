'use client';
// Reads barcodes and QR codes on-device (WebAssembly ZXing), so it works in Safari, Chrome and the native apps.
// Only the decoded text is sent to the server, never extra image data.

export type FoundCode = { format: string; text: string };

let ready: Promise<typeof import('zxing-wasm/reader')> | null = null;
function reader() {
  if (!ready) {
    ready = import('zxing-wasm/reader').then(async m => {
      m.prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? '/zxing_reader.wasm' : prefix + path) } });
      return m;
    });
  }
  return ready;
}

export async function detectCodes(files: Blob[]): Promise<FoundCode[]> {
  try {
    const { readBarcodes } = await reader();
    const seen = new Set<string>();
    const out: FoundCode[] = [];
    for (const f of files) {
      const results = await readBarcodes(f, { tryHarder: true, maxNumberOfSymbols: 6 });
      for (const r of results) {
        if (!r.isValid || !r.text || seen.has(r.text)) continue;
        seen.add(r.text);
        out.push({ format: r.format, text: r.text });
      }
    }
    return out;
  } catch (e) {
    console.warn('barcode reading unavailable', e);
    return [];
  }
}
