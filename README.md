# SC Cargo Planner

A Star Citizen cargo planner built with Next.js, React, and TypeScript. The beta implementation keeps one active run in your browser, with contract entry, screenshot scanning, cargo placement, route tracking, and crew payments.

The source is available for transparency, learning, and community contributions. The device and deployment checks listed below are still required before public beta.

## Implemented workflow

- Select a ship and plan contract or manually entered commodity cargo in one workspace.
- Enter and edit contracts, or scan a screenshot and correct the extracted fields before applying it.
- Generate a complete route and cargo layout, with capacity and placement validation.
- Follow visit-specific progress in the checklist and focused 2D route map. The cargo view uses the same plan.
- Restore the run, unfinished entries, crew settings, and progress in the same browser.
- Calculate crew shares from contract payouts or a manually entered commodity payout.

Accounts and synchronization are disabled. Authentication, signup, and account-update endpoints return `503`. The former shared contract API returns `410`; active runs use browser storage. NextAuth, Prisma, and bcrypt are no longer dependencies.

## Run locally

Use Node.js `24.20.0` and npm `11.19.0`. The package metadata enforces Node 24 and npm 11 minimum versions, and `.npmrc` enables strict engine checks.

1. Run `npm.cmd ci`.
2. Configure the map connection in `.env.local` as described below.
3. Run `npm.cmd run dev` and open [localhost:3000/cargo](http://localhost:3000/cargo).

Development and production builds use Webpack. Run `npm.cmd run build`, then `npm.cmd start` to check the production server locally.

## Configure SCMap

The planner calls SCMap through its own server routes. Set these server environment variables:

| Variable | Value |
| --- | --- |
| `SCMAP_BASE_URL` | SCMap API base URL, `http://localhost:3005/api` in local development |
| `SCMAP_API_KEY` | Key sent upstream in `X-API-Key` |
| `SCMAP_DEFAULT_SYSTEM` | Optional system identifier, defaults to `stanton` |
| `SCMAP_EXCLUDED_KINDS` | Optional comma-separated location kinds to exclude from imported data |

Keep `SCMAP_API_KEY` server-only. Do not prefix it with `NEXT_PUBLIC_` or include it in client code. Restart the planner server after changing environment variables.

The adapter requests `/systems`, `/systems/:id/all-locations`, and `/search`. It retains raw `position` coordinates from `all-locations`, resolved into system space in meters. No `project=true` parameter or additional parent offset is needed. The route view projects those coordinates locally and shows each system separately.

Local-detail integration uses `/systems/:id/bodies` and each body's `/locations` endpoint to identify body membership. Live body-level responses contain local positions despite the API reference describing resolved positions. Those coordinates do not replace `all-locations` positions. Generic duplicate IDs in body lists require an unambiguous identity match using non-coordinate context.

Some upstream body endpoints return `404`, including Pyro's `pyro5` and all three listed Nyx bodies in the local check. Unknown body keys and ambiguous or conflicting membership matches also leave context incomplete. The adapter retains fresh `all-locations` coordinates and successful memberships, reports `contextIncomplete` and `contextWarnings`, and offers a retry in the workspace. Incomplete body context does not make the entire location snapshot stale.

Duplicate location names are another upstream limitation. The planner rejects ambiguous required locations and omits ambiguous gateways from routing. Some cross-system routes remain unavailable until upstream identities distinguish those locations.

Planner clients use `/api/map/systems`, `/api/map/locations?system=stanton`, and `/api/map/search`. If a location request fails, the server uses the most recent successful snapshot for that system. That cache lasts only for the server process. If no snapshot exists, bundled locations may be available for the requested system. Responses identify fallback data with `meta.cached`; without either source, the route returns `502`. The workspace shows fallback or unavailable data and offers a retry.

## Verify changes

Run `npm.cmd run verify` for TypeScript checks, application lint, the full test suite including screenshot OCR, and a Webpack production build. Run `npm.cmd run test:ocr` to select the six checked-in screenshot fixtures directly.

The November 25, 2026 local verification passed TypeScript, clean lint, 282 tests across 26 files including the six OCR fixtures, and the production build. Chrome exercised the production bundle with local fixtures for map data and OCR assets.

Edge, real tablet testing, hosted CI and deployment, live OCR and asset delivery, and in-game ship accuracy remain open. Current npm audit results were unavailable.

## Contribute

Open an issue or pull request for a bug fix or proposed improvement. Include the affected workflow and verification results.

## Project notice

This project is provided for educational and community purposes. Star Citizen and related trademarks belong to Cloud Imperium Games. This fan tool is not affiliated with CIG.
