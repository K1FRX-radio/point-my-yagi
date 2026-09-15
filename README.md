# Point My Yagi

An Android-first mobile app built with [Expo](https://expo.dev) (React Native + TypeScript) using [Expo Router](https://docs.expo.dev/router/introduction).

## Prerequisites

- [Node.js LTS](https://nodejs.org/) (this project is developed on Node 22 LTS).
  If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use --lts` (or `nvm install 22`).
- The [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) app on your Android phone.
- No Android Studio, Android SDK, or Java is required for the Expo Go workflow below.

## Install dependencies

```bash
npm install
```

## Start the development server

```bash
npx expo start
```

This prints a QR code and a Metro URL such as `exp://<your-lan-ip>:8081`.

## Run on Android through Expo Go

1. Put your phone and this computer on the **same Wi-Fi network** (no client isolation).
2. Start the server: `npx expo start`
3. Open **Expo Go** on the phone and either scan the QR code shown in the terminal,
   or tap **Enter URL manually** and type the `exp://<your-lan-ip>:8081` URL from the terminal.

Fast Refresh is on by default: save a file and the change appears on the phone automatically.

### If the phone cannot connect (LAN blocked)

Some networks block device-to-device traffic. Use a tunnel, which relays through Expo's servers and
does not require any firewall changes:

```bash
npx expo start --tunnel
```

If the machine has more than one active network interface, pin Metro to your Wi-Fi IP:

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<your-wifi-ip> npx expo start
```

## Lint

```bash
npm run lint
```

## Type-check

```bash
npm run typecheck
```

> Note: `npm run typecheck` relies on generated types in `expo-env.d.ts` and `.expo/types/`.
> These are created automatically the first time you run `npx expo start`.

## Run tests

No tests are configured yet. Once a test runner (for example Jest via
[`jest-expo`](https://docs.expo.dev/develop/unit-testing/)) is added with a `test` script, run:

```bash
npm test
```

## Reset to a blank app

```bash
npm run reset-project
```

Moves the starter code to `app-example/` and creates a blank `app/` directory.
