import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'What The Fuck This?', template: '%s · What The Fuck This?' },
  description: 'Point phone. Thing judged. Keep thing, build thing, or thing go help dogs.',
  appleWebApp: { capable: true, title: 'WTF This', statusBarStyle: 'default' },
};
export const viewport: Viewport = { themeColor: '#D4FF3F', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const clerkOn = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const html = (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
  return clerkOn ? (
    <ClerkProvider appearance={{ variables: { colorPrimary: '#0A0A0B', borderRadius: '0px', fontFamily: 'Geist, system-ui, sans-serif' } }} signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
      {html}
    </ClerkProvider>
  ) : html;
}
