# mc-wtfit

**WTFIT: What The Fuck Is This?**

A genuinely good idea wearing a filthy name.

Prototype landing page: https://mattcarpenter.com/wtfit/

## About the name

It's the honest reaction everyone has when they open a drawer and find a cable, adapter, hub, or gadget they can't identify. The profanity is aimed at nobody: not people, not groups, not beliefs. It's aimed at the drawer.

## What it does

Clean the crap out of your house, and let the stuff you don't need do some good.

Take a photo of anything lying around: a cable, a hub, the fourth projector, a fondue set from 2009. WTFIT tells you:

- **What it is**
- **Whether it's useful to you**, based on your projects, skills, and the gear you already own
- **What to do with it**: keep it, build something with it, or let it go

## Where the money goes

If WTFIT decides you don't need something, this is what happens:

1. **It asks you first.** Nothing is ever listed without your confirmation.
2. **It lists the item for you** on eBay or the local equivalent, with the description and price written for you.
3. **Whatever money comes in goes to the beneficiary in your settings.**

| Setting | Where the money goes |
|---|---|
| **Default** | **Animal Welfare Gozo**, who rescue, treat and rehome injured strays across Gozo |
| Your choice of charity | Any cause you pick |
| Yourself | You. If you're hurting a little and need the money, redirect it to yourself. No judgement. |

You can change the beneficiary any time on the **Settings** page, per item or for everything.

The spirit of it: whatever you don't need goes to someone more vulnerable, and sometimes, honestly, that's you.

## Principles

- **Privacy-first:** bring your own LLM key; collect only the context that improves suggestions (projects, skills, gear)
- **Decisive:** the app makes the call so you don't have to
- **Unsure means retake:** low-confidence identification asks for a better photo, never a blind sale
- **Wiped before it ships:** anything with storage or an account gets a wipe-and-unlink checklist
- **A human confirms every listing**
- Accurate first, funny second

## Status

| Piece | State |
|---|---|
| Concept | [`docs/CONCEPT.md`](docs/CONCEPT.md) |
| Landing page | [`site/`](site/), live at mattcarpenter.com/wtfit |
| App (photo → verdict) | Not started |
| Settings page (beneficiary choice) | Not started |
| Marketplace listing (eBay etc.) | Not started |
| Storage | Planned: Postgres for items and verdicts, object storage for photos |
