# ExpensesControl - Android Release Guide

## Overview
This guide covers building and publishing the ExpensesControl Android app to Google Play Store.

## Current Status
- ✅ Capacitor Android project initialized
- ✅ App icons generated (all densities)
- ✅ Deep links configured (`/join/:groupId`)
- ✅ Signing keystore created
- ✅ `build.gradle` configured for release
- ⏳ **Requires Android Studio / SDK for final build** (see below)

---

## Prerequisites

### Required Software
1. **Node.js 18+** and npm
2. **Android Studio** (with Android SDK)
3. **Java JDK 17+**
4. **Git**

### Environment Variables
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

---

## Project Structure

```
expenses-control/
├── client/                          # React frontend
│   ├── android/                     # Capacitor Android project
│   │   ├── app/
│   │   │   ├── build.gradle         # App config + signing
│   │   │   ├── expensescontrol.keystore  # Signing key
│   │   │   └── src/main/
│   │   │       ├── AndroidManifest.xml   # App manifest + deep links
│   │   │       └── res/             # Icons, splash screens
│   │   └── build.gradle             # Project config
│   ├── capacitor.config.ts          # Capacitor config
│   └── dist/                        # Production build output
└── server/                          # Express backend
```

---

## Quick Build Instructions

### 1. Build the Web App
```bash
cd /home/kiwi/.openclaw/workspace-dev/expenses-control/client
npm run build
```

### 2. Sync with Capacitor
```bash
npx cap sync
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Build Release APK (in Android Studio)
- Build → Generate Signed App Bundle / APK
- Select "Android App Bundle" (AAB) for Play Store
- Use keystore: `android/app/expensescontrol.keystore`
- Key alias: `expensescontrol`
- Password: `ExpensesControl2026`

### 5. Or Build from Command Line
```bash
cd android
./gradlew bundleRelease   # For Play Store (AAB)
# OR
./gradlew assembleRelease # For APK
```

**Output locations:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Keystore Information

**⚠️ CRITICAL: Back up this keystore! You cannot update the app without it.**

- **Location:** `client/android/app/expensescontrol.keystore`
- **Alias:** `expensescontrol`
- **Store Password:** `ExpensesControl2026`
- **Key Password:** `ExpensesControl2026`
- **Valid Until:** September 13, 2053
- **Certificate Fingerprint (SHA-256):**
  ```
  C1:D8:B6:38:75:D1:B6:D4:08:D8:B4:8A:58:AC:B2:FF:E1:5A:56:4A:64:E3:F4:65:88:43:D3:8A:18:52:76:56
  ```

**Back up to:**
- External USB drive
- Cloud storage (encrypted)
- Password manager

---

## Google Play Store Upload Checklist

### Account Setup
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Complete identity verification
- [ ] Set up payments profile

### App Creation
- [ ] Create new app in Play Console
- [ ] Select default language (English)
- [ ] Choose app type: App (not game)
- [ ] Set free/paid: Free

### Store Listing
- [ ] **App name:** ExpensesControl
- [ ] **Short description** (80 chars max)
  ```
  Split expenses with friends and family. Track debts, settle up easily.
  ```
- [ ] **Full description** (4000 chars max)
  ```
  ExpensesControl helps you split bills and track shared expenses with friends, family, and roommates.

  Features:
  • Create groups for trips, events, or shared living
  • Add expenses with receipt photos
  • Automatic debt simplification
  • Push notifications for updates
  • Offline mode - works without internet
  • Biometric authentication for security
  • WebAuthn support for passwordless login
  • Dark mode support

  Perfect for:
  - Roommates splitting rent and utilities
  - Friends sharing vacation costs
  - Groups organizing events
  - Couples managing shared expenses

  Your data stays private and secure.
  ```
- [ ] **Screenshots** (upload for Phone, Tablet, TV)
    - Minimum 2 screenshots per type
    - Recommended: 8 screenshots
    - Resolution: 16:9 or 9:16
- [ ] **Feature graphic** (1024x500)
- [ ] **App icon** (512x512 PNG)

### Content & Compliance
- [ ] **Content rating:** Answer questionnaire (likely "Everyone")
- [ ] **Category:** Finance
- [ ] **Tags:** expense tracker, split bills, shared expenses
- [ ] **Privacy policy URL:** (create one or use generator)
- [ ] **Data safety form:** Complete questionnaire
- [ ] **Target countries:** Select distribution countries
- [ ] **Target SDK:** API 35 (Android 15) ✓

### Technical Setup
- [ ] **Upload AAB file** (`app-release.aab`)
- [ ] **Enable Play App Signing** (mandatory)
- [ ] **Set up signing** with uploaded keystore
- [ ] **Internal testing track:** Upload and test
- [ ] **Closed testing:** Add testers
- [ ] **Production release:** Publish

---

## Technical Details

### App Configuration
| Property | Value |
|----------|-------|
| App ID | `com.expensescontrol.app` |
| App Name | `ExpensesControl` |
| Version | `1.0` (versionCode 1) |
| Target SDK | API 35 (Android 15) |
| Min SDK | API 24 (Android 7.0) |
| Compile SDK | API 36 |
| Package Type | AAB (Android App Bundle) |

### Capacitor Configuration
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.expensescontrol.app',
  appName: 'ExpensesControl',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4f46e5', // Indigo
      showSpinner: false,
    },
  },
};
```

### Permissions
- `INTERNET` - Required for API communication
- `ACCESS_NETWORK_STATE` - Check connectivity
- `USE_BIOMETRIC` - For biometric authentication

### Deep Links Configured
- **HTTPS:** `https://expensescontrol.app/join/{groupId}`
- **App scheme:** `expensescontrol://join/{groupId}`

---

## Updating the App

### After Code Changes
```bash
# 1. Update version in android/app/build.gradle
#    Increment versionCode and update versionName

# 2. Build web app
cd client
npm run build

# 3. Sync with Capacitor
npx cap sync

# 4. Build release
npx cap build android --release \
  --keystorepath android/app/expensescontrol.keystore \
  --keystorepass ExpensesControl2026 \
  --keystorealias expensescontrol \
  --keystorealiaspass ExpensesControl2026 \
  --androidreleasetype AAB
```

### Version Update Checklist
- [ ] Increment `versionCode` in `build.gradle`
- [ ] Update `versionName` in `build.gradle`
- [ ] Update release notes
- [ ] Test on device
- [ ] Build new AAB
- [ ] Upload to Play Console
- [ ] Update store listing if needed

---

## Troubleshooting

### Build Errors

**Error: `SDK location not found`**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

**Error: `AAPT2 daemon startup failed`**
- Caused by wrong architecture (x86_64 binary on ARM64)
- Solution: Install correct AAPT2 or use Android Studio

**Error: `Cannot find module '@capacitor/core'`**
```bash
cd client && npm install && npx cap sync
```

**Error: Keystore not found**
- Verify keystore exists: `ls android/app/expensescontrol.keystore`
- Check build.gradle path matches

### Runtime Issues

**App crashes on launch:**
- Check `android/app/src/main/assets/public/` exists after sync
- Verify `capacitor.config.ts` has correct `webDir: 'dist'`

**Deep links not working:**
- Verify `AndroidManifest.xml` has intent-filter
- Check domain verification on device
- Test with: `adb shell am start -W -a android.intent.action.VIEW -d "https://expensescontrol.app/join/test"`

**Biometric auth not working:**
- Verify device has biometric hardware
- Check `USE_BIOMETRIC` permission in manifest

---

## Play Console Links

- **Play Console:** https://play.google.com/console
- **App Signing:** https://play.google.com/console/developers/app-signing
- **Help Center:** https://support.google.com/googleplay/android-developer

---

## Security Notes

- Keep keystore private and backed up
- Don't commit keystore to git
- Use environment variables for passwords in CI/CD
- Enable ProGuard/R8 minification for release builds
- Review Play Console security warnings

---

**Last Updated:** 2026-04-28
**Version:** 1.0
