# Data source policy and status

This app treats every remote data source as usage-restricted until its policy is
confirmed. Sources stay behind an `experimental` flag and are disabled in
production until permission and rate/caching guidance are documented here.

## POTA (Parks on the Air)

- **Endpoint used:** `GET https://api.pota.app/spot/activator`
- **Auth:** none required.
- **CORS:** the endpoint returns permissive CORS headers, so a client can call it
  directly without a proxy.
- **Verified:** 2026-09-15. Returns a JSON array of current activator spots.

### Observed response shape (per spot)

| Field                    | Type           | Notes                                                                                   |
| ------------------------ | -------------- | --------------------------------------------------------------------------------------- |
| `spotId`                 | number         | Unique per spot.                                                                        |
| `activator`              | string         | Operator callsign (may include `/P`, `/7`, etc.).                                       |
| `frequency`              | string         | kHz as a string, e.g. `"14074.0"`. Occasionally malformed (e.g. a value entered in Hz). |
| `mode`                   | string         | May be empty (`""`).                                                                    |
| `reference`              | string         | Park reference, e.g. `"US-0370"`.                                                       |
| `parkName`               | string \| null | Usually `null`; the real name is in `name`.                                             |
| `name`                   | string         | Park name.                                                                              |
| `locationDesc`           | string         | Region codes, e.g. `"US-MN"` (can be multiple).                                         |
| `spotTime`               | string         | UTC timestamp without offset, e.g. `"2026-09-15T21:45:48"`.                             |
| `spotter`                | string         | Who spotted it (RBN, a logger, or self).                                                |
| `grid4` / `grid6`        | string         | Maidenhead locators.                                                                    |
| `latitude` / `longitude` | number         | Park representative point, not the operator's exact position.                           |
| `count`                  | number         | Number of times spotted.                                                                |
| `expire`                 | number         | Countdown associated with the spot's validity.                                          |

### Handling rules implemented

- Coordinates are the **park's representative location**, never the activator's
  exact position. Every mapped target carries a location warning saying so.
- Park name comes from `name`, falling back to `parkName`, then `reference`.
- Frequencies are parsed from kHz to MHz; implausible values are dropped rather
  than shown.
- Empty modes are omitted. Missing/invalid coordinates cause the spot to be skipped.
- Duplicate spots (same activator + park) are collapsed to the most recent.
- Fetches happen only on explicit user action; results are cached in memory
  (default 60s TTL) to avoid rapid polling.
- Spot time is surfaced so the user can judge staleness.

### Policy status: PROVISIONAL — private development only

No official third-party API terms, rate limits, or data license were located.
The working endpoint proves technical feasibility but **not** permission for a
publicly distributed app.

- Keep the POTA source `experimental` and out of any production build.
- Before public release: contact POTA for written permission and expected
  rate/caching rules, and record the outcome here.
- Attribution shown in-app: "Spots courtesy of POTA (pota.app)".

## RepeaterBook — implemented behind a feature flag (Milestone 6)

- **Policy reviewed:** 2026-09-18, from https://www.repeaterbook.com/wiki/doku.php?id=api
- **Status: NOT APPROVED. Live calls are DISABLED by default** (`featureFlags.repeaterBook = false`).

### What the policy requires (as of the review date)

- API access is approval-first (since 2026-03-03). Unapproved clients are denied.
- Two token models. For a user-installed mobile app we are a **distributed/client
  application**: we must NOT embed a shared `app_` token. Each user generates
  their own app-bound `rbuapp_` token from https://www.repeaterbook.com/user/api_apps.php
  and pastes it into the app.
- Token is sent in the `X-RB-App-Token` header (preferred) or `Authorization:
Bearer`. Store it only in secure device storage; never in the repo/logs/URLs.
- A stable, identifying `User-Agent` is required (app name/version + contact
  email). Generic UAs are rejected, and requests are denied at runtime when the
  User-Agent does not match the approved value (`ua_mismatch`). See
  `REPEATERBOOK_USER_AGENT` in the source; the contact must be a real, reachable
  address before requesting approval.
- Endpoints: `api/export.php` (North America) and `api/exportROW.php` (rest of
  world), JSON. Export scopes: `api.export`, `api.export_row`; a token may be
  granted one or both.
- Commercial/for-profit use must purchase access; non-commercial use may be
  approved at no cost but is still discretionary.
- Attribution required: "Data courtesy of RepeaterBook.com" and link to the
  relevant RepeaterBook detail page.
- Rate limits are unpublished; back off immediately on HTTP 429. Do not retry
  auth/scope/User-Agent errors without fixing the cause.
- Non-competition: do NOT build a public repeater directory, map, nearby-finder,
  export/feed, or a redistributable database. Our narrow "select one repeater and
  point the antenna at it" workflow is the more-likely-approvable category, but is
  still gated.
- Android-only alternative: RepeaterBookConnect (a Content Provider reading the
  user's installed RepeaterBook app under a paid RB Connect subscription, £12 /
  $14.99/yr) avoids the Export API token/approval entirely. Not used here because
  the app is cross-platform and runs in Expo Go; kept as a possible later option.

### What is implemented now (no live calls)

- A `RepeaterBookTargetSource` that returns a clear permission/pending-approval
  error while the feature flag is off, and never performs a network request in
  that state.
- Targeted callsign lookup only: `search` uses the callsign as the server query
  and does not apply band/mode/region browse filters (results are only capped and
  optionally sorted nearest-first). There is no browsable repeater finder.
- Minimal-reference persistence: favorites/recents store RepeaterBook entries as a
  non-locating reference only (callsign, name, record id, detail link) via
  `toSavedTarget`; no RepeaterBook coordinates/frequency/mode are written to disk.
  Coordinates are re-fetched live on selection (`resolveSavedTarget`, by
  callsign), so no RepeaterBook dataset accumulates on the device.
- Schema mapping coded against a local fixture (`__fixtures__/export-records.json`),
  which must be re-verified against the live response once access is approved.
- A secure token store (`expo-secure-store`) for the per-user `rbuapp_` token.
- Attribution + per-record detail links on mapped targets.
- Only the minimum fields needed for pointing are mapped (coords, callsign,
  frequency, mode, name, detail link).

### Before enabling in a build

1. Apply as a distributed app: https://www.repeaterbook.com/api/token_request.php
2. Set `REPEATERBOOK_USER_AGENT` to a real app id + reachable contact email.
3. Verify the live JSON shape against the fixture and fix the mapping if needed.
4. Flip `featureFlags.repeaterBook` to `true` and ship the token-entry UI.

## QRZ — not yet implemented (Milestone 7)

Requires each user's own QRZ account and qualifying subscription. Credentials
live only in secure device storage.
