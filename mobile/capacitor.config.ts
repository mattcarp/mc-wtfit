import type { CapacitorConfig } from '@capacitor/cli';

// The native apps are thin, fast shells around the live app, so every feature ships to both phones at once.
// Forks: set WTF_APP_URL to your own server before `npx cap sync`.
const appUrl = process.env.WTF_APP_URL || 'https://app.wtfthis.com';

const config: CapacitorConfig = {
  appId: 'com.mattcarpenter.wtfthis',
  appName: 'WTF This',
  webDir: 'www',
  server: {
    url: `${appUrl}/app`,
    // Only these hosts load inside the app; everything else (eBay, Revolut, GitHub…) opens in the system browser.
    allowNavigation: [new URL(appUrl).hostname, '*.clerk.accounts.dev', 'clerk.wtfthis.com'],
  },
  ios: { contentInset: 'automatic', backgroundColor: '#F4F4F1' },
  android: { backgroundColor: '#F4F4F1' },
  plugins: {
    SplashScreen: { launchShowDuration: 600, backgroundColor: '#D4FF3F', showSpinner: false },
    StatusBar: { style: 'LIGHT', backgroundColor: '#F4F4F1' },
  },
};

export default config;
