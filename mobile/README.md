# WTF This: iPhone and Android apps

Native shells (Capacitor 7) around the web app. They open straight into the camera screen of the live app, so every feature ships to both phones at once.

- iOS: `ios/App` (Xcode). Bundle ID `com.mattcarpenter.wtfthis`
- Android: `android/` (Gradle). Application ID `com.mattcarpenter.wtfthis`
- Server URL: `WTF_APP_URL` env var when syncing (default `https://app.wtfthis.com`)

```sh
npm install --include=dev
WTF_APP_URL=https://your-server npx cap sync
npx cap open ios        # build and run from Xcode
cd android && ./gradlew assembleRelease   # signed APK (needs a keystore, see below)
```

Android release signing reads `~/Documents/projects/mc-wtfit-secrets/keystore.properties` (outside the repo). Forks: create your own keystore with `keytool` and point that file at it.

Inside the apps, sign-in is email only: Google blocks its sign-in inside embedded web views.
