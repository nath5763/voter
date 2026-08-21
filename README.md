# Voter App Prototype

Mobile-first Expo implementation of the voter-assistance UI plan in [`../docs`](../docs/). The current vertical slice runs on iOS, Android, and web with bilingual onboarding, local profile persistence, election/candidate flows, local native reminders, and responsive navigation.

## Run locally

Requirements: Node.js LTS and npm.

```bash
npm install
npm run web
```

For native development:

```bash
npm run android
npm run ios
```

Run static checks and create a web export:

```bash
npm run check
npx expo export --platform web
```

## Implemented slice

- Required English/Spanish onboarding.
- Prototype-only Texas address form and synthetic district resolution.
- Native secure profile persistence; browser prototype persistence uses local storage.
- Home, My Elections, Explore, Settings, notifications, election detail, candidate detail, and address-change routes.
- Neutral candidate cards, source metadata, data-status components, responsive bottom/side navigation, and accessible form/control semantics.
- Native local-notification permission and three fixture reminders. Web intentionally uses only the in-app notification center.
- Local profile and reminder deletion.

## Prototype safety boundaries

This build does **not** resolve real voting jurisdictions or provide a verified ballot. Candidate names, districts, ballot order, and some metadata are synthetic and are labeled throughout the UI. Do not enter a real address when demonstrating the browser build.

Production work remains blocked on the decisions in [`../docs/pre-implementation-decisions.md`](../docs/pre-implementation-decisions.md), especially:

- address/jurisdiction provider and privacy review;
- field-level Texas source matrix and completeness contract;
- freshness/conflict policy and operational ownership;
- approved English/Spanish election copy;
- accessibility device matrix and manual verification;
- production web storage and notification policy.

`npm audit --omit=dev` currently reports transitive `image-size` and `uuid` advisories through Expo/Metro tooling. Its automated forced fix proposes a breaking Expo downgrade, so `npm audit fix --force` must not be used. Track `SEC-01` and adopt an SDK-compatible upstream fix before pilot distribution.

## Source layout

```text
src/app/          Expo Router screens
src/components/   Shared accessible UI primitives
src/context/      Profile, locale, and hydration state
src/data/         Synthetic normalized election fixtures
src/i18n/         English and Spanish prototype copy
src/services/     Local profile and notification adapters
src/types/        UI-facing domain contracts
```
