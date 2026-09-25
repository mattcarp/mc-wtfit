# What The Fuck This?

**Point phone. Thing judged.**

A genuinely good idea wearing a filthy name, and bad grammar.

- Site: https://wtfthis.com
- App: https://wtfit.91-99-2-222.sslip.io (temporary address)

## About the name

You open a drawer. You find a cable, an adapter, a hub you cannot identify. You say it the way everyone says it, like a caveman holding a mystery rock: **"What the fuck this?"**

It started life as *WTFIT* ("What The Fuck Is This?"). Then the domain came back one word short, and the missing "is" turned out to be funnier. So the product talks like that too: short words, no articles, verdict first. Headlines grunt. Anything you need to act on (privacy, consent, money) is in plain English.

The profanity is aimed at nobody: not people, not groups, not beliefs. It's aimed at the drawer.

(The repo, Docker services and database are still called `wtfit` internally. Renaming plumbing buys nothing.)

## What it does

Clean the crap out of your house, and let the stuff you don't need do some good.

Take a photo of anything lying around: a cable, a hub, the fourth projector, a fondue set from 2009. WTF This tells you:

- **What it is**
- **Whether it's useful to you**, based on your projects, skills, and the gear you already own
- **What to do with it**: keep it, build something with it, or let it go

## Where the money goes

If WTF This decides you don't need something, this is what happens:

1. **It asks you first.** Nothing is ever listed without your confirmation.
2. **It lists the item for you** on eBay or the local equivalent, with the description and price written for you.
3. **Whatever money comes in goes to the beneficiary in your settings.**

| Setting | Where the money goes |
|---|---|
| **Default** | **[Gozo SPCA](https://gozo-spca.org/)** (Society for the Protection and Care of Animals in Gozo, since 1976), the island's only charitable rescue for dogs and cats |
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

## Run it yourself

WTF This is built to be forked. You need Docker and about two minutes.

```sh
git clone https://github.com/mattcarp/mc-wtfit && cd mc-wtfit
cp .env.example .env
# Fill in at least: POSTGRES_PASSWORD, ENCRYPTION_KEY (openssl rand -base64 32)
# Just for you on your own machine? Add AUTH_MODE=local and skip Clerk.
docker compose up -d --build
open http://localhost:3000
```

Then pick a brain in **Settings**: your own Anthropic, OpenAI or Google key, or a local model through Ollama (`openai-compatible`, base URL `http://host.docker.internal:11434/v1`, a vision model such as `llava` or `qwen2.5vl`).

| Piece | What it uses | Needed? |
|---|---|---|
| Database | Postgres (bundled, pgvector image) | Yes |
| Encryption | AES-256-GCM, key in `ENCRYPTION_KEY` | Yes |
| Sign-in | [Clerk](https://clerk.com), or `AUTH_MODE=local` for one owner | For public servers |
| Email | [Resend](https://resend.com) for waitlist confirmations. Without Resend but with Clerk, joining the waitlist sends a Clerk sign-up invitation instead. With neither, emails are logged | Optional |
| AI | Per-user key, or a shared server model with a daily cap | One of the two |

### Project layout

```
site/        Static landing page (also served by the app at /)
web/         The app: Next.js, API routes, migrations, Dockerfile
docs/        Concept
ROADMAP.md   What's done, what's next (native iPhone and Android apps included)
```

### Tests

`web/tests/e2e.sh` runs a full smoke test (analyze, photo, profile, sold, export, waitlist, delete) against a server in local mode with the mock model in `web/tests/mock-llm.mjs`.

## Status

See [ROADMAP.md](ROADMAP.md).

## License

[MIT](LICENSE). Take it, fork it, change it, sell it, run it for your own town's animal shelter. Just keep the copyright notice. When in doubt, give it to the animals.
