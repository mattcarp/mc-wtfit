import Link from 'next/link';
export default function NotFound() {
  return <main className="wrap app-main"><h1 className="display page-title">WTF this <span className="hl">page?</span></h1><p>Page not exist. <Link href="/app">Go back, scan thing</Link>.</p></main>;
}
