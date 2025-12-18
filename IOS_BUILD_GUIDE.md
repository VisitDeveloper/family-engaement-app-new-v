# iOS Build and Installation Guide

This guide will help you build and install your Expo app on iOS devices.

## Prerequisites

1. **Apple Developer Account** (required for production builds)
   - Free account works for development/testing on your own devices
   - Paid account ($99/year) required for App Store distribution

2. **macOS** (required for iOS builds)
   - You need a Mac to build iOS apps

3. **Xcode** (for local builds)
   - Install from Mac App Store
   - Install Command Line Tools: `xcode-select --install`

4. **EAS CLI** (recommended method)
   ```bash
   npm install -g eas-cli
   ```

## Method 1: EAS Build (Recommended - Cloud Build)

EAS Build is the modern, recommended way to build Expo apps. It builds your app in the cloud, so you don't need Xcode installed.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Build
The `eas.json` file is already configured. You can customize it if needed.

### Step 4: Build for iOS

**For Development/Testing (Internal Distribution):**
```bash
eas build --platform ios --profile preview
```

**For Production (App Store):**
```bash
eas build --platform ios --profile production
```

**For Simulator:**
```bash
eas build --platform ios --profile development
```

### Step 5: Download and Install

After the build completes:
1. You'll get a download link in the terminal
2. Download the `.ipa` file
3. For internal distribution, you can:
   - Use **TestFlight** (recommended): Upload to App Store Connect and distribute via TestFlight
   - Use **Ad-hoc distribution**: Install directly via Apple Configurator or Xcode
   - Use **EAS Submit**: `eas submit --platform ios`

## Method 2: Local Build (Requires Xcode)

If you have Xcode installed and want to build locally:

### Step 1: Install CocoaPods (if not already installed)
```bash
sudo gem install cocoapods
```

### Step 2: Generate Native iOS Project
```bash
npx expo prebuild --platform ios
```

### Step 3: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

### Step 4: Build and Run
```bash
npx expo run:ios
```

This will:
- Build the app
- Open in iOS Simulator (if available)
- Or install on connected device (if configured)

### Step 5: Create Archive for Distribution

1. Open the project in Xcode:
   ```bash
   open ios/YourAppName.xcworkspace
   ```

2. In Xcode:
   - Select your device or "Any iOS Device"
   - Go to Product → Archive
   - Once archived, click "Distribute App"
   - Choose distribution method (Ad-hoc, App Store, etc.)

## Method 3: Development Build (For Testing)

For development builds that you can install on your device:

### Step 1: Create Development Build
```bash
eas build --platform ios --profile development
```

### Step 2: Install on Device

**Option A: Using EAS Build**
- Download the `.ipa` file from the build link
- Install via Xcode or Apple Configurator

**Option B: Using Expo Development Client**
1. Install Expo Go or Development Client on your device
2. Run `npx expo start --dev-client`
3. Scan QR code with your device

## Installing on Physical iOS Device

### Using TestFlight (Recommended)

1. **Upload to App Store Connect:**
   ```bash
   eas submit --platform ios
   ```

2. **Add Testers:**
   - Go to App Store Connect → TestFlight
   - Add internal/external testers
   - Testers receive email invitation

3. **Install:**
   - Testers install TestFlight app
   - Accept invitation
   - Install your app from TestFlight

### Using Ad-hoc Distribution

1. **Build with Ad-hoc profile:**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Add Device UDIDs:**
   - Get device UDID from Settings → General → About
   - Add to Apple Developer Portal → Devices
   - Rebuild with updated profile

3. **Install:**
   - Download `.ipa` file
   - Use Apple Configurator 2 or Xcode to install
   - Or use a service like Diawi for easier distribution

### Using Xcode Directly

1. Connect device via USB
2. Open project in Xcode
3. Select your device as target
4. Click Run (▶️)
5. Trust developer certificate on device: Settings → General → VPN & Device Management

## Troubleshooting

### Common Issues

1. **"No devices found"**
   - Ensure device is connected and trusted
   - Check USB connection
   - Restart Xcode

2. **Code Signing Errors**
   - Ensure Apple Developer account is configured
   - Check bundle identifier matches in app.json and Xcode
   - Verify certificates in Apple Developer Portal

3. **Build Fails**
   - Check `eas.json` configuration
   - Verify `app.json` has correct iOS settings
   - Check EAS Build logs: `eas build:list`

### Useful Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]

# Update EAS CLI
npm install -g eas-cli@latest
```

## Next Steps

- **App Store Submission**: Use `eas submit` after production build
- **Continuous Updates**: Use EAS Update for OTA updates
- **Analytics**: Set up analytics in your app
- **Crash Reporting**: Configure crash reporting services

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS App Distribution](https://docs.expo.dev/submit/ios/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

