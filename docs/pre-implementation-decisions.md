# Pre-implementation Decisions and Readiness

Status: open decision register  
Applies to: nationwide state/federal MVP (50 states plus Washington, DC)  
Related documents: [UI/UX Foundations](ui-ux-foundations.md), [Screen and Flow Specification](ui-screen-flow-spec.md)

## 1. How to use this register

An item is `BLOCKING` when implementation would otherwise encode a privacy, correctness, legal, or platform assumption that is expensive or unsafe to reverse. `PRE-PILOT` items may use the documented temporary default during development but must close before external testing. `LATER` items do not block the MVP and must not be implemented implicitly.

Each decision closes only when it has:

1. a named accountable owner;
2. a written outcome and rationale;
3. links to evidence or validation results;
4. affected documentation and acceptance tests updated;
5. an approval date.

Suggested roles are placeholders until the project assigns people: Product, Design, Engineering, Data, Privacy/Legal, Accessibility, and Localization.

## 2. Decisions already made

| ID | Decision | Outcome |
| --- | --- | --- |
| BASE-01 | Platform priority | Mobile-first with responsive web adaptations |
| BASE-02 | Supported jurisdictions | State and federal elections in all 50 states plus Washington, DC |
| BASE-03 | Onboarding access | Required before substantive content |
| BASE-04 | Location input | Residential address required |
| BASE-05 | Address retention | Full address stored locally on-device |
| BASE-06 | Profile minimization | Eligibility attestation only; no name/email/birth date |
| BASE-07 | Languages | English and Spanish at MVP launch |
| BASE-08 | Reminder consent | Contextual opt-in after elections are found |
| BASE-09 | Candidate order | Official ballot order; labeled alphabetical fallback |
| BASE-10 | Candidate neutrality | No recommendations, rankings, ideology labels, or engagement personalization |

These decisions are reopened only through an explicit product decision that updates all three UI planning documents.

## 3. Blocking decisions

| ID | Question | Recommended default | Owner | Needed before | Verification needed |
| --- | --- | --- | --- | --- | --- |
| ADDR-01 | Which service validates the address and resolves all MVP districts? | Use the U.S. Census Geocoder for durable nationwide jurisdiction resolution; optionally enrich supported elections through Google Civic Information with `officialOnly=true` | Engineering + Data + Privacy | Address flow implementation | Representative test-address coverage across every supported jurisdiction, ambiguity behavior, quotas, terms, retention, and outage behavior |
| ADDR-02 | What provider-specific privacy text and consent are required? | Name the provider and link its privacy policy before entry; make no claim that the address stays on-device during resolution | Privacy/Legal + Product | Production onboarding copy | Data-flow review, provider terms, network inspection, local storage inspection |
| DATA-01 | Which sources populate each nationwide MVP fact? | Maintain a field-level matrix led by each jurisdiction's official election authority and applicable county/federal authorities | Data + Product | Data/schema implementation | Sample election with source URL, retrieval, verification, and fallback for every field in every adapter |
| DATA-02 | What freshness thresholds control warnings and reminders? | Provisional thresholds: deadlines/requirements stale after 7 days in an active election window and 30 days otherwise; candidate lists stale after 24 hours near filing/certification changes and 7 days otherwise | Data + Product | Reminder engine implementation | Simulated aging, source outage, and changed-date tests; operational feasibility review |
| DATA-03 | Who adjudicates conflicting official sources and how quickly? | Block reminders for the disputed fact, display both sources, and require a human resolution record | Data | Ingestion conflict handling | Conflict drill with state/county and official/aggregator examples |
| DATA-04 | What qualifies a candidate list or contest list as complete? | Require explicit certification/completeness metadata from the ingestion pipeline; absence is `INCOMPLETE`, never inferred from a nonempty list | Data | Candidate UI implementation | Cross-jurisdiction primary, runoff, general, special, uncontested, and withdrawal fixtures |
| L10N-01 | Who translates and reviews election terminology? | Professional English↔Spanish translation with a bilingual election-domain reviewer; machine translation may aid drafting but cannot approve release copy | Product + Localization | Copy freeze | Terminology glossary, reviewer sign-off, pseudo-localization and native-device review |
| TRUST-01 | Who approves neutrality and high-stakes explanatory copy? | Joint Product, Design, and Privacy/Legal approval using a documented neutrality checklist | Product | Copy freeze | Blind review of candidate, eligibility, ID, mail-voting, and source-conflict screens |
| A11Y-01 | What supported device/assistive-technology matrix gates release? | Current and previous major iOS/Android versions on representative physical devices; current evergreen browsers; VoiceOver, TalkBack, keyboard, Windows screen reader, zoom, forced colors | Accessibility + Engineering | UI platform setup | Written matrix with versions, devices, owners, and repeatable test scripts |
| OPS-01 | Who owns data verification and incident response? | Assign a human on-call owner during active election windows; stale/conflicting data cannot rely on unattended automation | Product + Data | Pilot data publication | Runbook exercise for incorrect deadline, broken source, and pipeline outage |

### ADDR-01 decision note

Google Civic Information's `voterInfoQuery` requires a registered address and only returns voter data for supported elections. It may return polling locations, contests, candidates, and election officials, but it is not sufficient by itself for persistent year-round jurisdiction resolution. The implementation team must validate whether to combine it with official district datasets or another provider. See [Google Civic Information voterInfoQuery](https://developers.google.com/civic-information/docs/v2/elections/voterInfoQuery).

### DATA-02 provisional policy

The proposed thresholds are development fixtures, not approved election policy. Until approved:

- reminders may be exercised with fixture data only;
- production copy must not promise that data is `current` merely because a download succeeded;
- a conflict always overrides freshness and prevents scheduling for the disputed fact;
- official source availability and last verification are separate statuses.

## 4. Pre-pilot decisions

| ID | Question | Temporary default | Owner | Evidence to close |
| --- | --- | --- | --- | --- |
| NOTIF-01 | Are browser notifications part of MVP? | No. Web receives only the in-app notification center; iOS/Android use local notifications | Product + Engineering | Browser support/cost analysis and a separate consent/permission UX if scope changes |
| NOTIF-02 | Which reminder offsets are defaults? | Registration: 14, 7, 1 days; early voting start: 1 day; mail request/return: 7 and 1 days; Election Day: 7 and 1 days plus morning-of only if platform scheduling is reliable | Product | User testing, platform scheduling limits, duplicate/overlap review |
| NOTIF-03 | What happens when the OS scheduled-notification limit is reached? | Prioritize actionable deadlines over generic Election Day countdowns and show what was not scheduled | Engineering + Product | iOS/Android limit tests with worst-case nationwide fixture |
| BRAND-01 | What name and visual identity communicate nonpartisanship? | Use working name `Voter` and a neutral monochrome wordmark; avoid red/blue party pairing, flags as decoration, stars-and-stripes spectacle, and official-government mimicry | Product + Design | Trademark/name check and representative trust testing |
| CONTENT-01 | How much legal complexity appears inline? | Plain-language summary plus key exceptions and official link; never issue individual legal conclusions | Product + Privacy/Legal | Review representative state eligibility, voter ID, mail voting, provisional ballot, and registration scenarios |
| CONTENT-02 | What terminology glossary governs English and Spanish? | Create one canonical glossary before production copy; terms have definition, source, approved translations, and prohibited ambiguous synonyms | Localization + Product | Signed glossary and consistency audit |
| PRIV-01 | How is the locally stored address protected? | Use platform-appropriate encrypted/secure storage for sensitive profile values and SQLite for non-sensitive derived/cache data; verify backups and device transfer behavior | Engineering + Privacy | Threat model, storage inspection, backup/restore tests, deletion test |
| PRIV-02 | Are analytics or crash reporting allowed? | No telemetry SDK in MVP until an event/data inventory and opt-out policy are approved | Product + Privacy | Vendor/data-flow review and proof that address, districts, candidate behavior, and URLs cannot be emitted |
| LINK-01 | Which external domains are allowed and how are broken links handled? | Curated HTTPS allowlist for official/campaign sources; campaign links use a destination warning and official links are identified | Data + Security | Redirect, takeover, HTTP downgrade, tracking-query, and unavailable-link tests |
| SUPPORT-01 | What help channel is offered without accounts? | Static help/methodology content plus a non-personal issue-report route that warns users not to submit address or sensitive voter data | Product + Privacy | Support workflow and retention review |
| SEC-01 | How will current Expo/Metro transitive dependency advisories be resolved? | Stay on the validated Expo SDK 57 dependency set; do not use `npm audit fix --force`, which currently proposes a breaking Expo downgrade. Track compatible upstream fixes before pilot distribution | Engineering + Security | Clean production audit or written risk acceptance tied to exact shipped dependency versions |

Expo's current `expo-notifications` reference lists Android and iOS, not web, so browser notifications are excluded unless separately designed and implemented. See [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/).

## 5. Explicitly deferred decisions

These questions belong to later phases and must not expand the MVP accidentally:

| ID | Deferred capability | Trigger to revisit |
| --- | --- | --- |
| LATER-01 | User accounts and cross-device sync | A validated need exceeds local backup/restore behavior |
| LATER-02 | Email reminders | Phase 3 backend and verified-subscription design begins |
| LATER-03 | Remote push | A timely update use case justifies backend/device-token storage |
| LATER-04 | Local elections, ballot measures, polling places | Phase 4 personalized-ballot coverage and local-source operations are funded |
| LATER-05 | Candidate comparison | Neutrality research defines factual comparable fields and missing-data handling |
| LATER-06 | Campaign finance and voting history | Phase 2 data quality, time windows, inflation/context, and neutral presentation are specified |
| LATER-07 | Favorites or following other states | Research shows a need and notification scope remains comprehensible |
| LATER-08 | Candidate photos | Complete, licensed, equally treated imagery can be maintained |
| LATER-09 | Additional languages | Translation ownership and state-specific source coverage are available |
| LATER-10 | Registration-status integration | An official service and privacy/legal review support an exact confirmation claim |

## 6. Required validation artifacts

Before feature implementation starts, create or approve:

- field-level nationwide source matrix with authority, refresh cadence, and fallback for every jurisdiction adapter;
- address-resolution spike report covering at least urban, rural, apartment, new-development, ambiguous, out-of-state, and PO-box inputs;
- privacy data-flow diagram from typed address through network request, local storage, logs, crash handling, backup, change, and deletion;
- English/Spanish terminology glossary and translation workflow;
- neutrality checklist for candidate/order/source presentation;
- accessibility support matrix and manual test scripts;
- time and timezone rules for date-only and timestamped deadlines;
- notification scheduling policy, platform-limit strategy, and changed/conflicting-data behavior;
- data incident runbook with named owners and correction/audit procedure;
- representative normalized fixtures for every data status and screen empty/error state.

## 7. Fixture and scenario catalog

The implementation test dataset must be synthetic or public and must not contain a real user's full residential address.

### Address fixtures

- clear urban addresses across multiple U.S. regions;
- one apartment with secondary-unit normalization;
- one rural route or nonstandard but valid residential address;
- one address producing multiple candidates;
- one new or unresolved address;
- one PO box;
- one valid address for each supported state and Washington, DC, plus unsupported territory/military/overseas cases;
- provider timeout, quota, malformed response, and offline states.

### Election fixtures

- primary, primary runoff, general, special, and runoff;
- federal-only, state-only, and combined elections;
- no upcoming supported election;
- complete and incomplete contest lists;
- official ballot order and absent ballot order;
- uncontested, withdrawn, and disqualified candidates;
- missing party, campaign URL, incumbency, or photo;
- verified, changed, stale, incomplete, conflicting, and unavailable facts;
- changed deadline with an old scheduled reminder;
- date-only deadline, received-by timestamp, postmarked-by rule, and timezone difference;
- source available only in English and broken external link.

### Profile and platform fixtures

- English and Spanish;
- eligibility values `ELIGIBLE`, `PREPARING`, and `PREFER_NOT_TO_SAY`;
- notification permission not determined, authorized, denied, provisional where applicable, and unsupported on web;
- smallest compact screen at maximum text size;
- medium and wide layouts at 200% and 400% zoom;
- offline with cache, offline without cache, corrupt cache, and successful recovery.

## 8. Definition of ready for UI implementation

UI implementation may begin when:

- every `BLOCKING` decision is closed;
- the three UI planning documents contain no contradictions with the product architecture;
- address and election source spikes demonstrate the data required by the screen contract;
- approved English and Spanish terminology exists for the first implemented flow;
- reusable fixtures cover all `DataStatus` values;
- acceptance scenarios have owners and target platforms;
- the team can explain, in one consistent statement, where an address is sent, stored, and deleted;
- the data team can explain how an incorrect deadline is detected, suppressed, corrected, and communicated;
- the accessibility owner has approved the component and manual-test baseline.

Development can use temporary brand assets and provisional reminder offsets. It must not ship production address disclosure, election reminders, candidate completeness claims, telemetry, or high-stakes eligibility/requirement copy under an unresolved default.
