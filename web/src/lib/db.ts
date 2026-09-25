import 'server-only';
import postgres from 'postgres';

const g = globalThis as unknown as { __wtfitSql?: ReturnType<typeof postgres> };

// Lazy: postgres() does not connect until the first query, so builds without a DB are fine.
export const sql = g.__wtfitSql ?? (g.__wtfitSql = postgres(process.env.DATABASE_URL ?? 'postgres://localhost/wtfit', {
  max: 5,
  idle_timeout: 30,
  onnotice: () => {},
}));
