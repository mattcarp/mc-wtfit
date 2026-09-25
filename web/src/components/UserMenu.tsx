'use client';
import { UserButton } from '@clerk/nextjs';
export function UserMenu() {
  return <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32, borderRadius: 0, border: '1.5px solid #0A0A0B' } } }} />;
}
