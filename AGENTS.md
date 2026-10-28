# Rotation Sensor App - AI Agent Instructions

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Quick Run Rule (When User Says "run this", "start", or "run")

Whenever the user asks to run the app or start the project:
1. **Immediately start the dev server** in background with `npx expo start -c` (clear cache).
2. **Do NOT ask questions or request confirmation** — execute immediately.
3. Show the interactive options to the user:
   - Press `a` for Android Emulator / connected USB device
   - Press `i` for iOS Simulator
   - Press `w` for Web
   - Scan QR code via Expo Go on Android or Camera on iOS
4. Keep the output clean, fast, and token-efficient. Avoid analyzing large unnecessary files or node_modules.

## Commands

```bash
npx expo start -c           # Start dev server immediately with clean cache
npx expo start --android    # Run directly on Android
npx expo start --ios        # Run directly on iOS
npx expo start --web        # Run directly on Web
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm add
npx expo install --fix      # Fix incompatible dependencies
```

## Token Efficiency & Clean Context Rules for AI

- **NEVER** inspect `node_modules/`, `.expo/`, build outputs, lockfiles (`package-lock.json`, etc.), or bundle outputs.
- Keep responses concise, direct, and actionable.
- Main entry point and core logic is in [App.js](file:///c:/Users/ATIF/Desktop/rotation-sensor-app/App.js). Configuration is in [app.json](file:///c:/Users/ATIF/Desktop/rotation-sensor-app/app.json) and [package.json](file:///c:/Users/ATIF/Desktop/rotation-sensor-app/package.json).

