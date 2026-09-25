import Link from 'next/link';
export default function NotFound() {
  return <main className="wrap app-main"><h1 className="display page-title">What the fuck is <span className="hl">this</span> page?</h1><p>Nothing here. <Link href="/app">Back to scanning</Link>.</p></main>;
}
