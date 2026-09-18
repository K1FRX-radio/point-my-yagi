# RepeaterBook Export API — Distributed App Application

Record of the API access request submitted for Point My Yagi via
https://www.repeaterbook.com/api/token_request.php (distributed-app lane).
Keep this in sync with the code and with `docs/data-source-policy.md`; RepeaterBook
audits approved apps against publicly available materials.

## Access model

I develop or maintain a distributed app (installed by users, runs on mobile
devices, open source, cannot keep a shared token secret). Users generate their
own app-bound `rbuapp_` tokens; no shared `app_` token is embedded.

## Header fields

- **Contact Name / Call Sign:** K1FRX
- **Contact Email:** K1FRX-radio@gmail.com
- **Project / Application Name:** Point My Yagi
- **Project website or review link:** https://github.com/K1FRX-radio/point-my-yagi (open source)
- **Application User-Agent:** `PointMyYagi/1.0 (+https://github.com/K1FRX-radio/point-my-yagi; K1FRX-radio@gmail.com)`
- **Requested scopes:** `api.export` (North America) and `api.export_row` (rest of world); either alone is acceptable.

## Application review details

Accurately aiming a directional, tight-beam antenna like a Yagi is tricky and
takes real calculation. An aid is valuable in plenty of situations, like chasing
weak POTA, SOTA, or IOTA activations, or quickly re-aiming toward a different
local repeater to follow a net or a conversation. Those are the situations that
motivated me to develop Point My Yagi.

Point My Yagi is an open-source, non-commercial application being developed as an antenna aiming aid for licensed amateur operators who want to point their directional antennas at particular stations (repeaters, ham stations,
POTA/SOTA/IOTA events).

For the repeater case, the operator names one specific repeater they already intend to work (by callsign, e.g.: W1XM), and the app computes the great-circle bearing and distance from the phone's current GPS position to the known Lat-Long coordinates of that repeater, and shows a live compass arrow to help physically aim the operator's directional antenna (normally a Yagi, hence the name). The app is not intended to be a browse/search/map/discovery experience, but rather an aiming tool for known single targets.

Point My Yagi is being designed as a distributed mobile app; each user will supply their own `rbuapp_` token.

The scopes I'm requesting are: `api.export` and `api.export_row` (either alone would be acceptable).

## Intended use and audience

- **Primary RepeaterBook use:** Other (explain below). Explanation:
  "Single-target antenna-aiming aid. The operator names one specific repeater they already intend to work and the app computes the bearing and distance from their current GPS position to physically aim a directional (Yagi) antenna at it. This is neither radio programming nor nearby-repeater discovery: the user already knows which repeater they want, and the app only adds the pointing calculation."

  - **Who can use it:** Public users. The app is publicly installable and open
    source; each user authenticates with their own token.

- **Estimated users:** 25 (new, pre-release open-source hobby project).

## API workflow and data fields

**User action that triggers a request:** A request is made only when the operator
explicitly taps "Look up" after typing a specific repeater's callsign (optionally
refined by frequency) into the target screen. There is no automatic, background,
on-scroll, or location-polled querying; one deliberate user action produces one
lookup.

**Exact search / region limits:** Queries are limited to a single targeted lookup
keyed on `callsign` (with optional `frequency`), never open-ended or
wildcard-harvesting queries. North American lookups use `api/export.php` (scope
`api.export`); rest-of-world lookups use `api/exportROW.php` (scope
`api.export_row`). Region is bounded to the user's own area of operation for the
repeater they name; the app does not sweep states, countries, or regions to build
a list.

**Fields needed:** Only the minimum required to identify and aim at one repeater:
state/repeater id (record key), callsign, latitude, longitude, nearest
city/location, state and country, frequency, operating mode, and the
precise-location flag. No other fields are read or stored.

**Maximum results:** A targeted callsign lookup normally returns one or a few
records. The app requests no bulk sets and caps handling to a small result list
(25 max) purely so the operator can disambiguate when one callsign has multiple
repeaters; only the single record the user selects is retained for aiming.

**How the selected data is used:** From the one selected repeater the app uses
latitude/longitude to compute great-circle bearing and distance from the phone's
current GPS position, then renders a live compass arrow for aiming a directional
antenna. Callsign, frequency, and mode are shown as confirmation labels. The live
record is held in session memory only (~60-second TTL) and then discarded. If the
user saves the target to their on-device favorites/recents, only a minimal
non-locating reference is stored (callsign, display name, RepeaterBook record id,
and detail-page link), never coordinates, frequency, or mode; those are
re-fetched live from RepeaterBook on re-selection. Nothing is exported,
redistributed, re-served, or accumulated into an offline dataset.

## Relationship to RepeaterBook

Point My Yagi complements RepeaterBook by adding a capability RepeaterBook does
not provide: turning a single chosen repeater's coordinates into a live
great-circle bearing and distance so an operator can physically aim a directional
(Yagi) antenna at it. It sits downstream of the user's decision, after they
already know which repeater they want to work, and adds antenna-pointing, not
repeater discovery.

It does not recreate any RepeaterBook feature:

- **Search:** No browsable or filterable search interface. The user must name one
  specific repeater by callsign; the app performs a single targeted lookup, not
  open-ended querying or discovery.
- **Map:** No map view, no plotting of repeaters, no proximity/"nearby" listing.
  Output is a single compass arrow toward one selected target.
- **Directory:** The app has no browsable catalog of the RepeaterBook dataset and
  no way to discover repeaters through it. The only list is the user's own private
  favorites/recents shortlist on their device, containing solely the repeaters
  that individual user already selected to aim at. It is single-user, never shared
  or published, holds only a minimal non-locating reference for RepeaterBook
  entries (callsign, name, record id, detail link, no coordinates at rest), and
  cannot be used to search or browse RepeaterBook's data. Each entry links back to
  its RepeaterBook detail page. It functions as personal recall, not a directory
  or a substitute for RepeaterBook's listings.
- **Database:** No RepeaterBook dataset is stored, bundled offline, or
  accumulated. Live results live in session memory only (~60-second TTL) and are
  discarded. The optional favorites/recents list persists only a minimal
  non-locating reference for RepeaterBook targets (callsign, name, record id,
  detail link); coordinates are never stored at rest and are re-fetched live from
  RepeaterBook when needed, so the app cannot become a local repeater database.
- **Export service:** No export, feed, sync, mirror, redistribution, or secondary
  API. Data never leaves the device except the user's own token in the request
  header to RepeaterBook.

Every result credits "Data courtesy of RepeaterBook.com" and links back to that
repeater's RepeaterBook detail page, so users are directed to RepeaterBook rather
than away from it. Because each user authenticates with their own `rbuapp_` token
and there is no shared backend, the app cannot function as a substitute directory,
portal, or data service.

## Credential handling and abuse prevention

**Where the token is stored:** Each user generates their own app-bound `rbuapp_`
token at /user/api_apps.php and pastes it into the app. It is stored only in the
device secure enclave (iOS Keychain / Android Keystore via `expo-secure-store`).
No shared `app_` token exists anywhere in the client, source, or binaries.

**Who can access it:** Only the OS keystore of that single device, released to the
app process at request time. There is no backend server, no shared storage, and no
developer-side access; the token never reaches any third party. It is never placed
in the repository, URLs, screenshots, or documentation.

**How it is transmitted:** Only over HTTPS to RepeaterBook, in the `X-RB-App-Token`
header, accompanied by the approved stable User-Agent. It is sent to no other
host. Since there is no backend, the token travels only from the user's device
directly to RepeaterBook.

**What is logged:** The token is never logged. Requests are not persisted to any
analytics or logging service. Retrieved records are held in session memory only
(~60-second TTL) and then discarded; the only data written to the device is the
user's own token in the secure enclave and, if the user opts to save a target, a
minimal non-locating reference (callsign, name, record id, detail link) in the
local store. No RepeaterBook coordinates or bulk data are written to disk.

**How unauthorized use and bulk scraping are prevented:** Requests are strictly
user-initiated, one targeted callsign lookup per explicit tap, with no background
sync, polling, prefetching, wildcard harvesting, or region sweeping. Because
access is bound to each user's own token, a lost or misused token affects only
that user and can be revoked by them from the RepeaterBook dashboard. The app
backs off immediately on HTTP 429 and does not auto-retry `auth_*`,
`auth_scope_denied`, or `ua_mismatch` errors without correcting the cause, so it
cannot be turned into a scraping or re-serving tool.

## Rate and abuse controls

**Concurrency:** At most 1 in-flight request at a time. Lookups are serialized; a
new lookup cannot start until the previous one resolves or is cancelled. No
parallel fan-out across regions or endpoints.

**Request rate:** User-initiated only. A debounce enforces a minimum 1 second
between lookups (rapid repeated taps are ignored), and the client self-limits to a
ceiling of about 20 lookups per minute, well below any realistic aiming workflow
(a user typically does 1 to a few lookups per session).

**Pagination limits:** None used. Each lookup is a single request with no paging
through result sets and no "next page" traversal. Handling is capped at 25 records
returned for one callsign purely for disambiguation; the app never walks or
accumulates larger sets.

**Duplicate suppression:** An identical lookup (same callsign/frequency) repeated
within the 60-second in-memory TTL is served from the cached result instead of
issuing a new request. Combined with the 1-second debounce, this prevents
redundant calls from repeated taps or re-entering the same target.

**429 / backoff behavior:** On an HTTP 429, the app stops immediately and does not
retry the current action. Subsequent user-initiated lookups apply exponential
backoff starting at 2 seconds and doubling (2s, 4s, 8s) up to a 60-second cap
before any further request is permitted. `auth_*`, `auth_scope_denied`, and
`ua_mismatch` errors are surfaced to the user and are not auto-retried without
correcting the cause.

## Cache and retention policy

**Whether results are stored:** Live lookup results are held only in volatile
session memory (~60-second TTL) and are not written to disk. The app has an
optional on-device favorites/recents list, but for RepeaterBook targets it stores
only a minimal non-locating reference (callsign, display name, the RepeaterBook
record id, and the RepeaterBook detail-page link). It does not store RepeaterBook
coordinates, frequency, or mode at rest. Full details, including coordinates, are
re-fetched live from RepeaterBook (using the user's own token) when the user
re-selects that entry, so no RepeaterBook dataset accumulates on the device.

**Where:** Session results live in app RAM only. The minimal favorites/recents
reference lives in the app's local key-value store on that single device. The
user's `rbuapp_` token lives in the device secure enclave. There is no backend, so
nothing is stored server-side or shared.

**For how long:** Session results expire after ~60 seconds and clear on leaving
the aiming screen or closing the app. Recents are capped at 15 entries (oldest
dropped). Favorites persist until the user deletes them. The daily "worked"
convenience list stores only opaque `callsign:recordId` keys for the current UTC
day and is discarded the next day; it holds no coordinates.

**Who can read them:** Only the current app process on that single device, for
that single user. No other app, user, server, or the developer can read them;
nothing is networked or shared.

**How they are refreshed or deleted:** Live data is refreshed only by an explicit
user-initiated lookup (or by re-selecting a saved reference, which triggers a
fresh RepeaterBook fetch). Session results delete on TTL expiry and screen exit.
Recents self-evict past the 15-item cap; favorites are deleted by the user; the
worked list auto-deletes on UTC day rollover.

## Attribution and link-back plan

Wherever a RepeaterBook-derived repeater is shown or acted on, the app displays
"Data courtesy of RepeaterBook.com" and a tappable link to RepeaterBook:

- **Pointing screen (primary display):** When the active target is a RepeaterBook
  repeater, the screen shows the "Data courtesy of RepeaterBook.com" credit and a
  link to that specific repeater's RepeaterBook detail page
  (`repeaters/details.php?state_id=…&ID=…`) alongside the bearing/distance
  readout. This is the screen where the data is actually used, so the attribution
  and per-record link-back appear here on every RepeaterBook target.
- **Saved favorites/recents rows:** Each saved RepeaterBook entry shows its
  RepeaterBook source label and carries the same detail-page link, so attribution
  and link-back travel with the entry wherever it is recalled.
- **RepeaterBook source screen:** Displays the standing "Data courtesy of
  RepeaterBook.com" credit and a link to repeaterbook.com, plus the explanation
  that data comes from the user's own RepeaterBook token.
- **Per-record link target:** The link on every RepeaterBook record points to that
  record's own RepeaterBook detail page (not a generic homepage), so users are
  returned to the authoritative RepeaterBook listing for the exact repeater.

Attribution is shown as visible on-screen text next to the data (not buried in an
about box), and RepeaterBook links open in the system browser. The credit and link
are present on any surface that renders RepeaterBook data; no RepeaterBook data is
shown anywhere without them.

## Status and category fields

- **Commercial status:** Non-commercial.
- **Implementation status:** Prototype (the RepeaterBook integration is coded but
  gated behind a disabled feature flag with no live calls yet, pending approval).
- **Source availability:** Open source (https://github.com/K1FRX-radio/point-my-yagi).
- **Attestations (all affirmed):**
  - Display "Data courtesy of RepeaterBook.com." and link back where practical.
  - Will not mirror, redistribute, bulk-export, re-serve, or use the data to build
    another directory, dataset, service, or API without written permission.
  - Understand that commercial or future-commercial use requires written terms and
    compensation before a token is issued.
- **Project Categories:** Open-Source, Not for Profit, Hobby/Personal.
