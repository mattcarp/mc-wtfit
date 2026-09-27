'use client';
import { SignIn, SignUp } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

// Google refuses OAuth inside embedded app webviews, so the native iOS/Android shells offer email sign-in only.
function useIsNativeApp() {
  const [native, setNative] = useState(false);
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    setNative(!!cap?.isNativePlatform?.());
  }, []);
  return native;
}

export function AuthWidget({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const native = useIsNativeApp();
  const appearance = native ? { elements: { socialButtonsBlockButton: { display: 'none' }, socialButtons: { display: 'none' }, dividerRow: { display: 'none' } } } : undefined;
  return mode === 'sign-in'
    ? <SignIn forceRedirectUrl="/app" appearance={appearance} />
    : <SignUp forceRedirectUrl="/app/profile" appearance={appearance} />;
}
