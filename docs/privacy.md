# Privacy

Point My Yagi is designed to keep your data on your device.

## Location

- Your current location is read from the device only to compute the bearing and
  distance to the target you select, and to orient the compass pointer.
- Location is used on-device and is **not** transmitted anywhere by the app.
- Foreground location permission is requested only when needed, and the app
  handles denial without crashing.

## Data stored on the device

The following are stored locally (AsyncStorage or the device keychain) and are
never uploaded by the app:

- Preferences (units, bearing display, alignment tolerance, haptics, theme).
- Favorites and recent targets.
- "Worked today" contact marks (per activator + park, for the current UTC day).
- Any RepeaterBook token you enter (in the secure device keychain via
  `expo-secure-store`).

## Network requests

- **POTA** (experimental): current activator spots are fetched from
  `api.pota.app` only when you open the POTA screen or tap Refresh. No account or
  credentials are sent.
- **RepeaterBook**: disabled until the application is approved. When enabled, it
  makes only user-triggered requests using your own token; the token is sent to
  RepeaterBook only, and stored solely in the device keychain.
- No analytics, tracking, or advertising SDKs are included.

## Attribution

- POTA: "Spots courtesy of POTA (pota.app)".
- RepeaterBook: "Data courtesy of RepeaterBook.com".

## Future changes

If a future feature ever needs to send your location or contact history off the
device (for example, syncing to an online logbook), it will be explicit,
opt-in, and documented here before it ships.
