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

## RepeaterBook — not yet implemented (Milestone 6)

Requires prior application approval per the RepeaterBook API policy. Live calls
stay disabled by default until approved.

## QRZ — not yet implemented (Milestone 7)

Requires each user's own QRZ account and qualifying subscription. Credentials
live only in secure device storage.
