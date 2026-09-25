import 'server-only';
import { sql } from './db';

export type AuthMode = 'clerk' | 'local' | 'off';

export function authMode(): AuthMode {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) return 'clerk';
  if (process.env.AUTH_MODE === 'local') return 'local';
  return 'off';
}

export type AppUser = { id: string; email: string | null };

/** The signed-in user, or null. In local mode (self-hosting on your own machine) there is one owner. */
export async function getUser(): Promise<AppUser | null> {
  const mode = authMode();
  if (mode === 'local') return { id: 'local-owner', email: process.env.LOCAL_OWNER_EMAIL || null };
  if (mode === 'off') return null;
  const { auth, currentUser } = await import('@clerk/nextjs/server');
  const { userId } = await auth();
  if (!userId) return null;
  const u = await currentUser();
  return { id: userId, email: u?.primaryEmailAddress?.emailAddress ?? null };
}

/** Like getUser, but also makes sure the user has a row in our database. */
export async function getAppUser(): Promise<AppUser | null> {
  const u = await getUser();
  if (!u) return null;
  await sql`insert into users (id, email) values (${u.id}, ${u.email})
            on conflict (id) do update set email = coalesce(excluded.email, users.email)`;
  await sql`insert into settings (user_id) values (${u.id}) on conflict do nothing`;
  return u;
}
