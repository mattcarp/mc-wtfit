# WTF This? roadmap

## Now (v0.1, working)
- [x] Landing page with waitlist (double opt-in email)
- [x] Camera-first web app: open, shoot, verdict. No typing; the prompt is built in
- [x] Verdict engine: keep / build / let it go / retake, with guardrails (unsure means retake, never sell the only charger, wipe checklists)
- [x] Private profile (homes, projects, skills, hobbies, interests, habits, goals, gear, GitHub repos, optional "anything else" with explicit consent), encrypted at rest
- [x] Settings: beneficiary (Gozo SPCA default, any charity, or yourself), currency, AI provider (shared default, Anthropic, OpenAI, Google, any OpenAI-compatible such as Ollama) with encrypted API keys
- [x] Your stuff: ledger of every verdict, listing drafts, mark kept / listed / sold / donated, total raised
- [x] GDPR: export everything, delete everything, privacy notice
- [x] Installable on iPhone and Android as a web app (Add to Home Screen)
- [x] Docker Compose: fork, fill in `.env`, `docker compose up`

## Just added
- [x] Private GitHub repos via the user's own read-only token (Metadata: Read-only; names and descriptions only, never code), plus a repo filter
- [x] "Where you sell" preference (eBay UK/DE/US, MaltaPark, Facebook Marketplace, Vinted) and a **Sell it** button: copies the listing and opens the sell page. Two taps
- [x] Payout details: after a sale, "Send €X to the Gozo SPCA" with IBAN (checksum-validated), Revolut and Wise links. Forks set their own default beneficiary in `.env`. WTF This never touches the money

## Next
- [ ] eBay Sell API: post listings directly from the app after the user connects their eBay account (needs an eBay developer app)
- [ ] Clerk production instance on the final domain
- [ ] Resend sending domain verified on the final domain
- [ ] Final domain (see README) and move the app to it
- [ ] Ask Gozo SPCA how they want to receive proceeds; add a "send proceeds" step with their details
- [ ] Better "build" suggestions using pgvector similarity over the inventory
- [x] Multiple photos per item (up to 3), paste (⌘V) and drag-and-drop on desktop
- [x] On-device barcode and QR reading; Matter QR codes looked up in the official CSA registry
- [ ] Photo storage on Cloudflare R2 / S3 (driver swap in `web/src/lib/storage.ts`)
- [ ] Offline queue: shoot now, judge when back online

## From the handover notes ([docs/WTFThis_Handover_Doc.md](docs/WTFThis_Handover_Doc.md))
- [ ] Visual eval suite: real photos with expected answers (`web/tests/visual_eval/`), run against the live model before every prompt change. Start with the UGREEN coupler label and the mixed bulb-and-Arlo pile
- [ ] Mixed piles: one photo, several things. Return a list of items, each with its own verdict, instead of forcing one answer for the whole heap
- [ ] "What charges this?": record the power port (USB-C, Micro-USB, barrel, proprietary) and the likely charger, and match it against cables you already own
- [ ] Where it lives: optional storage location per item (bin, drawer, house) so the ledger doubles as a findable inventory
- [ ] Don't trust the caption: when the user's note says "smart bulbs" but the photo shows something else, go with the photo and say so

## Native apps
- [x] Android app: signed APK, camera opens on tap, released as v0.1.0 (`mobile/android`)
- [x] iPhone app: Xcode project builds and runs (`mobile/ios`); TestFlight as soon as the Apple Developer membership is active
- [ ] iPhone: upload to TestFlight, invite friends
- Built with Capacitor 7: native shells around the live app, so features ship to both phones at once
- The web app already covers both phones today; native adds instant camera launch, share-sheet ("What the fuck is this?" from Photos), and push when a listing sells

## Listing automation (later)
- [ ] eBay / local marketplace posting via API, with the human confirming every listing
- [ ] Track sale and payout to beneficiary
