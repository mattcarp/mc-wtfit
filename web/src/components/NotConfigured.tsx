import Link from 'next/link';
export function NotConfigured() {
  return (
    <main className="wrap app-main">
      <h1 className="display page-title">Almost.</h1>
      <div className="notice prose">
        <p><strong>Sign-in isn&apos;t configured on this server yet.</strong></p>
        <p>To run WTFIT for other people, add Clerk keys (<code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code>) to the server&apos;s environment. To run it just for yourself on your own machine, set <code>AUTH_MODE=local</code>.</p>
        <p>Meanwhile, <Link href="/#join">join the list</Link> and we&apos;ll tell you when it&apos;s open.</p>
      </div>
    </main>
  );
}
