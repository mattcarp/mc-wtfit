#!/usr/bin/env bash
# End-to-end smoke test against a running server in AUTH_MODE=local with the mock model:
#   node tests/mock-llm.mjs &   (then SERVER_AI_PROVIDER=openai-compatible SERVER_AI_BASE_URL=http://127.0.0.1:4011/v1)
#   BASE=http://localhost:3000 bash tests/e2e.sh path/to/photo.jpg
set -euo pipefail
B=${BASE:-http://localhost:3000}; IMG=${1:?photo path}; J='Content-Type: application/json'
pass() { echo "PASS $1"; }; die() { echo "FAIL $1"; exit 1; }
curl -sf $B/api/health | grep -q '"ok":true' && pass health || die health
R=$(curl -sf -F "photo=@$IMG;type=image/jpeg" $B/api/analyze) && pass analyze || die analyze
ID=$(echo "$R" | sed -E 's/.*"id":"([^"]+)".*/\1/')
curl -sf -o /dev/null $B/api/photos/$ID && pass photo || die photo
curl -sf -X PUT -H "$J" -d '{"profile":{"hobbies":"soldering"},"sensitiveConsent":false}' $B/api/profile >/dev/null && pass profile || die profile
curl -sf -X PATCH -H "$J" -d '{"status":"sold","soldAmount":5}' $B/api/items/$ID | grep -q '"sold"' && pass sold || die sold
curl -sf $B/api/me/export | grep -q soldering && pass export || die export
curl -sf -H "$J" -d '{"email":"e2e@example.com"}' $B/api/waitlist | grep -q '"ok":true' && pass waitlist || die waitlist
curl -sf -X DELETE -H "$J" -d '{"confirm":"DELETE"}' $B/api/me | grep -q '"ok":true' && pass delete || die delete
echo "all good"
