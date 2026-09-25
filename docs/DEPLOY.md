# Deploying WTF This

## Current production (Matt's Hetzner box)

- Host: `hetzner` (91.99.2.222), directory `~/apps/wtfit`, started with `docker compose up -d --build`
- App container listens on `127.0.0.1:3120`; its own Postgres (`pgvector/pgvector:pg17`) is internal to the compose network
- Secrets live only in `~/apps/wtfit/.env` (mode 600), with a backup in `~/apps/wtfit-secrets/`
- **Back up `ENCRYPTION_KEY`.** Without it, profiles, API keys and photos cannot be decrypted
- TLS and routing: the box's shared Caddy (`/etc/caddy/Caddyfile`):

```caddy
wtfit.91-99-2-222.sslip.io {
	encode zstd gzip
	request_body {
		max_size 12MB
	}
	reverse_proxy 127.0.0.1:3120
}
```

Add the final domain as another address on the same block once its DNS points at the box, then `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`.

## Updating

From a machine that can SSH to the box:

```sh
rsync -az --delete --exclude node_modules --exclude .next --exclude .git --exclude .env ./ hetzner:apps/wtfit/
ssh hetzner 'cd ~/apps/wtfit && docker compose up -d --build && docker builder prune -af'
```

The disk on that box is nearly full; always prune the build cache after a build.

## Anywhere else

Any machine with Docker: follow "Run it yourself" in the README, put a TLS proxy (Caddy, Traefik, nginx) in front of `APP_PORT`, and set `APP_URL` to the public URL.

## Sign-in

Clerk is currently a keyless development instance created for WTF This. Claim it into your Clerk account with the claim link stored in `~/apps/wtfit-secrets/clerk-claim-url.txt` on the box. For launch, create a production instance on the final domain and swap the two `CLERK` keys in `.env` (then rebuild: the publishable key is baked in at build time).
