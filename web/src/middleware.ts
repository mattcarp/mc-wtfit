import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

const clerkOn = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
const clerk = clerkOn ? clerkMiddleware() : null;

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  return clerk ? clerk(req, ev) : NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|landing.html|styles.css|icon|apple-icon|manifest.webmanifest|.*\\.(?:css|js|png|jpg|svg|ico|webmanifest)$).*)'],
};
