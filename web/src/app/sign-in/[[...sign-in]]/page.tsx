import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { authMode } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export default function Page() {
  if (authMode() !== 'clerk') return <main className="wrap app-main"><p>Sign-in is not configured. <Link href="/app">Go to the app</Link></p></main>;
  return <main className="wrap app-main" style={{ display: 'grid', placeItems: 'center', gap: 24 }}><Link className="wordmark" href="/">WTFIT</Link><SignIn forceRedirectUrl="/app" /></main>;
}
