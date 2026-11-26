# SC Cargo Planner

A Star Citizen cargo planner for contract and commodity hauling. Plan your cargo load, follow your route, and split the payout with your crew.

## Features

- Select a ship and enter cargo contracts or commodity loads.
- Scan contract screenshots and review the extracted details before adding them to a run.
- Plan pickups and deliveries around the ship's cargo capacity and available space.
- Track each stop with a route checklist and map. Inspect container placement in the 3D cargo hold.
- Resume a saved run in the same browser and calculate payouts by crew share.

## Run locally

Use Node.js 24.20.0 and npm 11.19.0.

```sh
npm ci
npm run dev
```

Open [localhost:3000/cargo](http://localhost:3000/cargo). On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

## Configure SCMap

To use live location data, configure SCMap in `.env.local`.

| Variable | Value |
| --- | --- |
| `SCMAP_BASE_URL` | SCMap API URL, such as `http://localhost:3005/api` |
| `SCMAP_API_KEY` | Server-side API key |
| `SCMAP_DEFAULT_SYSTEM` | Optional. Defaults to `stanton`. |
| `SCMAP_EXCLUDED_KINDS` | Optional comma-separated list of location types to exclude. |

Keep the API key in server-side configuration and restart the app after changing these settings.

The planner can use cached or bundled location data when SCMap is unavailable. Available routes depend on the location and gateway data for each system.

## Contribute

Run `npm run verify` to check types, lint, tests, and the production build. Run `npm run test:ocr` to test the screenshot fixtures.

Open an issue or pull request for a bug fix or proposed improvement. Include the affected workflow and verification results.

## Project notice

This project is provided for educational and community purposes. Star Citizen and related trademarks belong to Cloud Imperium Games. This fan tool is not affiliated with CIG.
