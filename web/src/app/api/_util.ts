import 'server-only';
import { NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';

export const json = (data: unknown, status = 200, headers?: HeadersInit) => NextResponse.json(data, { status, headers });
export const fail = (message: string, status = 400, headers?: HeadersInit) => json({ error: message }, status, headers);

export async function withUser<T>(fn: (u: { id: string; email: string | null }) => Promise<T>) {
  const u = await getAppUser();
  if (!u) return fail('Sign in first.', 401);
  return fn(u);
}
