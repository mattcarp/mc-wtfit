import Link from 'next/link';
export default function NotFound() {
  return <main className="wrap app-main"><h1 className="display page-title">What the fuck this <span className="hl">page?</span></h1><p>Nothing here. <Link href="/app">Back to scanning</Link>.</p></main>;
}
