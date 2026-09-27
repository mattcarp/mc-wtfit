# Hard photos: notes from an early review

Two real photos from Mattie's house, what's actually in them, and what they teach the app.
Both are test fixtures in [`web/tests/visual_eval/`](../web/tests/visual_eval/), where the expected answers live in `cases.json`.

## 1. The sealed bag (`ugreen-coupler-label.jpg`)

A white poly bag. Nothing inside is visible; only an Amazon thermal label.

- **What it is:** UGREEN RJ45 female-to-female Ethernet coupler, 5-pack. Label text: `20311P5`, EAN `6957303825417`, Amazon FNSKU `X000B56PAL` (the barcode).
- **Lesson:** when there's a label, the label is the answer. Read it, trust it, and don't guess from shape. The barcode reader in the browser already decodes the FNSKU and hands it to the model.
- **Lesson:** "Let it go" isn't automatic. A household full of projectors and Raspberry Pis runs plenty of Ethernet. Whether couplers are useful depends on the profile, not on a rule like "wireless homes don't need these".

## 2. The pile (`bulb-pile.jpg`)

The owner called it "a shit ton of smart bulbs". About half of it is.

| What | How you can tell |
| --- | --- |
| Aigostar G80 E27 amber filament bulbs, 4-pack | Box: 600 lm, 6 W, 2200 K |
| ExtraStar 6 W E14 candle bulbs, **pack of 3** | Box: 480 lm, 3000 K, "PACK X3" (easy to miscount as 6) |
| Smart Wi-Fi dimmable E14 candle bulb, RGB + warm white | Small box: C37, 4.9 W, 380 lm, works with Google Assistant and Alexa |
| Govee smart bulbs, E27, many | "Govee" printed on the bulb necks |
| Arlo security gear, two white units | "arlo" logo on the housings (exact models not confirmed) |
| Philips Hue / Signify 24 V LED lightstrip | Cable tag: model 929002…, 24 V, 830 mA, 20 W, 1600 lm, 4000 K, Signify, Eindhoven NL |
| Loose vintage filament bulbs, clear and amber | Visible filaments |
| A "Smart Wi-Fi LED Bulb" user manual | Paper booklet |

The white soundbar at the top edge is furniture, not part of the pile.

- **Lesson:** a pile is many things. One verdict for the whole heap is wrong by design. The app needs to return a list, each item with its own verdict.
- **Lesson:** trust the photo over the caption. If the owner says "smart bulbs" or "Eufy cameras" and the housing says Arlo, say Arlo, and say it politely.
- **Lesson:** small print wins. The lightstrip is only identifiable from a tag the size of a stamp. Worth zooming, or asking for a close-up.

## 3. "What charges this?"

A real and common question. Rather than a hard-coded brand-to-port table (it goes stale with every new model), each item should record:

- the power port it has (USB-C, Micro-USB, barrel, mains, proprietary magnetic, battery-only),
- the likely charger or supply (for example "5 V USB" or "24 V Hue power supply"),

so the ledger can answer "do I own the thing that powers this?", and the "don't sell the only charger" rule can check real cables instead of guessing. Port details read from a photo must be treated as a guess unless the label or manual says so.

## 4. Where it lives

An optional storage location per item (the bin, drawer or house), so "Your stuff" doubles as an inventory you can search.

## What changed in the app because of these notes

See the "From the handover notes" section of [ROADMAP.md](../ROADMAP.md).
