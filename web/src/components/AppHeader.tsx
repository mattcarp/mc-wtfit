import Link from 'next/link';
import { authMode } from '@/lib/auth';
import { UserMenu } from './UserMenu';

const LINKS = [
  { href: '/app', label: 'Scan' },
  { href: '/app/stuff', label: 'Stuff' },
  { href: '/app/profile', label: 'Profile' },
  { href: '/app/settings', label: 'Settings' },
];

export function AppHeader({ current }: { current: string }) {
  const clerk = authMode() === 'clerk';
  return (
    <header className="app-header">
      <div className="wrap">
        <Link className="wordmark" href="/">WTF THIS</Link>
        <nav className="app-nav" aria-label="App">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} aria-current={current === l.href ? 'page' : undefined}>{l.label}</Link>
          ))}
        </nav>
        {clerk ? <UserMenu /> : <span className="label">Local mode</span>}
      </div>
    </header>
  );
}
