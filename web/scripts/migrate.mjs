// Applies SQL files in ../migrations in order, once each. Safe to run on every boot.
import postgres from 'postgres';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
if (!process.env.DATABASE_URL) { console.error('migrate: DATABASE_URL is not set'); process.exit(1); }
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
let tries = 0;
for (;;) {
  try { await sql`select 1`; break; }
  catch (e) { if (++tries > 30) throw e; console.log('migrate: waiting for database...'); await new Promise(r => setTimeout(r, 2000)); }
}
await sql`create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())`;
const done = new Set((await sql`select version from schema_migrations`).map(r => r.version));
for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(f)) continue;
  await sql.begin(async tx => { await tx.unsafe(readFileSync(join(dir, f), 'utf8')); await tx`insert into schema_migrations (version) values (${f})`; });
  console.log('migrate: applied', f);
}
await sql.end();
