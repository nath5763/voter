# Voter

Local-first Expo SDK 57 election calendar for all 50 states and Washington, DC.

## Current implementation

- Nationwide residential-address entry and U.S. Census geography resolution.
- Optional Google Civic official-only corroboration during supported elections.
- Expo SQLite repositories, migrations, atomic jurisdiction installs, notification history, and reminder identifiers.
- Native SecureStore for the full address; web keeps the full address only for the tab session.
- Static manifest and one partitioned dataset per state/DC, validated with Zod and content hashes.
- Repository-driven Home, My Elections, nationwide Explore, election/candidate details, Settings, and notification center.
- Local native reminder reconciliation derived only from verified or changed deadlines.
- English and Spanish application copy.

The checked-in seed datasets intentionally have `INCOMPLETE` status. They establish safe nationwide behavior and the federal general-election date without inventing state deadlines, requirements, contests, or candidates. The publication workflow refuses to release data until every jurisdiction is complete. Official state/DC source adapters and human verification remain required before the nationwide Phase 1 release gate can pass.

## Run locally

Use Node.js 22.13 or newer.

```bash
npm install
npm run data:generate
npm run check
npm test
npm run web
```

Native development:

```bash
npm run android
npm run ios
```

## Runtime configuration

Set these through Expo environment configuration:

- `EXPO_PUBLIC_DATA_BASE_URL`: HTTPS directory containing `manifest.json`, `federal.json`, and `states/*.json`.
- `EXPO_PUBLIC_GOOGLE_CIVIC_API_KEY`: optional platform-restricted key used only when Google lists a supported election.

Without `EXPO_PUBLIC_DATA_BASE_URL`, the app uses its bundled nationwide seed and clearly labels coverage incomplete. Without the Civic key, Census district resolution and static election data continue to work.

## Data commands

```bash
npm run data:generate
npm run data:validate
npm run data:release-check
```

`data:release-check` intentionally fails while any state/DC dataset is incomplete. This is the deployment safety gate.

## Privacy boundaries

The address is sent directly to the U.S. Census Geocoder and, when configured and supported, Google Civic Information. The app has no account or profile backend. Native full addresses are stored in SecureStore. Browser full addresses are session-only; only derived districts, masked location, preferences, cache state, and local history persist in browser SQLite.

PO boxes, APO/FPO, overseas addresses, local elections, ballot measures, email, remote push, candidate finance, and legislative voting histories are outside Phase 1.
