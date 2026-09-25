import 'server-only';
import { redirect } from 'next/navigation';
import { authMode, getAppUser, type AppUser } from './auth';

/** For pages under /app: the user, or a redirect to sign-in, or null when auth isn't configured. */
export async function pageUser(path: string): Promise<AppUser | null> {
  const u = await getAppUser();
  if (u) return u;
  if (authMode() === 'clerk') redirect(`/sign-in?redirect_url=${encodeURIComponent(path)}`);
  return null;
}
