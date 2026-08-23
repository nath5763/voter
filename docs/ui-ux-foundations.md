# UI/UX Foundations

Status: implementation planning baseline  
Applies to: nationwide state/federal MVP (50 states plus Washington, DC)  
Platforms: iOS, Android, responsive web  
Related documents: [Screen and Flow Specification](ui-screen-flow-spec.md), [Pre-implementation Decisions](pre-implementation-decisions.md), [High-Level Product and Architecture Plan](us-election-app-high-level-plan.md)

## 1. Product promise

The app helps a voter answer four questions without promoting a party, candidate, or position:

1. What election affects me next?
2. What must I do, and by when?
3. What do I need in order to vote?
4. Who will appear on my ballot?

The MVP is an information and reminder product. It does not register a voter, cast a ballot, recommend candidates, predict results, or claim that its content replaces an election authority. Actions such as registration or ballot-status lookup open an identified official website.

## 2. Locked product decisions

| Topic | MVP decision |
| --- | --- |
| Design priority | Mobile-first, followed by explicit tablet and web adaptations |
| Coverage | State and federal elections for all 50 states plus Washington, DC |
| First-run access | Onboarding is required before substantive app content |
| Location | A residential address is required to create the local profile |
| Retention | The address is stored only on the device and can be changed or deleted |
| Other profile data | Eligibility attestation only; no name, email, or birth date |
| Languages | English and Spanish at launch |
| Candidate order | Official ballot order when supplied, otherwise alphabetical with a visible explanation |
| Notifications | Contextual opt-in after relevant elections are found; denial does not block the app |
| Backend | None for the MVP; election data is static and profile data is local |

## 3. Audience and core jobs

The primary audience is a resident of any of the 50 states or Washington, DC who is eligible or preparing to become eligible to vote. The interface must not assume knowledge of election terminology, party structures, districts, or voting methods. It must work for:

- a first-time voter who wants a short, guided checklist;
- an experienced voter checking a deadline or requirement;
- a voter using assistive technology or large text;
- a voter with limited connectivity;
- an English- or Spanish-speaking voter;
- a user who distrusts political apps and needs to verify every consequential fact.

The primary jobs are ordered as follows:

1. Find the next action that applies to the voter.
2. Confirm the source and freshness of that action.
3. Review the election's dates, requirements, offices, and candidates.
4. Schedule or adjust local reminders.
5. Explore other state or federal elections without changing the home jurisdiction.

## 4. Experience principles

### 4.1 Action before volume

Lead with the next deadline or preparation task, not a feed of election news. Home must remain useful when there are many contests and when no election is imminent.

### 4.2 Explain jurisdiction

Whenever a district-specific item is shown, provide a plain-language explanation such as `Shown for U.S. House District 7, based on your saved address`. Do not expose raw geographic identifiers without a human-readable label.

### 4.3 Provenance in the path of action

A voter must not need to open a separate legal or sources page to learn where a deadline came from. The provider and verification date appear with the fact; expanded provenance is one interaction away.

### 4.4 Neutral by construction

Candidate presentation, party labels, colors, photography, information density, link styles, and empty fields must be structurally equivalent. Editorial prominence cannot be purchased, personalized, or inferred from incumbency, fundraising, polling, or popularity.

### 4.5 Honest uncertainty

Missing, stale, or conflicting election data is a user-facing state. Do not silently substitute a calculated date, hide a conflict, or imply that an incomplete candidate list is complete.

### 4.6 Calm urgency

Use direct time-sensitive language without alarmism. `Registration deadline in 3 days` is acceptable. `Last chance! Act now!` is not.

### 4.7 Privacy before personalization

Explain why the address is needed, where it is sent, and where it is stored before displaying the address field. Do not request contacts, precise device location, name, date of birth, or email for the MVP.

## 5. Information architecture

After onboarding, mobile uses four persistent destinations:

| Destination | Purpose | Default content |
| --- | --- | --- |
| Home | Answer what is next | Next action, next election, preparation checklist, freshness summary |
| My Elections | Show address-relevant elections | Upcoming first, then recent/past; filter by state/federal and election type |
| Explore | Browse outside the personalized sequence | Nationwide state and federal election calendars |
| Settings | Control local data and behavior | Address, language, reminders, privacy, accessibility help, about |

The notification center is a header action rather than a fifth destination. It displays a badge only for unread, material updates. On wide web layouts, the four destinations become a left navigation rail; the notification action remains in the page header.

### Navigation rules

- System Back returns to the prior screen and never silently changes the saved address.
- A tab selection returns to that tab's last stable route. Selecting an already active tab returns to its root and scrolls to the top.
- Notification taps deep-link to the affected election, deadline, or data-change explanation.
- Official external links show the destination organization and open outside the app or in the platform browser. They never masquerade as an in-app transaction.
- Unsaved setting changes require confirmation before leaving only when losing them would surprise the user.

## 6. Responsive layout

Breakpoints are implementation tokens, not assumptions about device names:

| Layout | Content behavior |
| --- | --- |
| Compact, under 600 logical px | Single column, bottom tabs, full-width cards, sticky primary action only when needed |
| Medium, 600–1023 logical px | Navigation rail, single reading column up to 720 px, optional contextual side panel |
| Wide, 1024 logical px and above | Navigation rail, primary column up to 760 px, secondary source/checklist column up to 360 px |

Rules:

- Reading content never stretches edge-to-edge on wide screens.
- Candidate cards remain a single ordered list. Do not use multi-column placement that changes perceived candidate order.
- Reflow, rather than horizontal scrolling, is required at 320 CSS px and at 400% browser zoom, except for genuinely two-dimensional data that cannot be represented as cards.
- Modals on compact screens become full-screen sheets; on wide screens they use a dialog with a visible close control and trapped focus.
- Dates and deadlines never rely on relative text alone. Show `3 days left` with the full localized date and timezone context.

## 7. Neutral visual and content system

### 7.1 Color and hierarchy

- The core palette uses civic-neutral brand colors and semantic status colors.
- Red and blue must not be used as persistent party containers or as the primary brand pair.
- Party affiliation is text, not a color encoding. If a party supplies an official mark later, all candidates must receive equal treatment and the mark must not determine card prominence.
- The only semantic colors are success/verified, caution/stale or incomplete, error/conflict, and informational/change. Each is paired with an icon and text label.
- Incumbency is a text attribute with the same typographic weight as party and office; it is not a badge that visually endorses the candidate.

### 7.2 Candidate presentation

Each candidate row uses the same fields and ordering:

1. Candidate name.
2. Party as reported by the filing source, or `Party not provided`.
3. Incumbent status when verified.
4. Official campaign website, explicitly labeled as campaign content.
5. Filing source and verification date.

Photos are excluded from MVP list rows. If candidate photos are added later, every listed candidate in a contest must use the same crop, size, quality rule, and fallback treatment. The list follows official ballot order where available. The list footer explains the ordering source and fallback.

### 7.3 Plain-language rules

- Prefer `Election Day` over `date of election` and `Mail ballot` over an unexplained acronym.
- Define `primary`, `runoff`, `incumbent`, `district`, and `provisional ballot` at first relevant use.
- Avoid `your ballot` when the source cannot verify a complete address-specific ballot. Use `Contests currently available for your districts`.
- Mark campaign sites as `Candidate campaign website`; do not label them `Learn more` without context.
- Do not paraphrase a complex legal requirement into a categorical eligibility judgment. Summarize, cite, and link to the official details.
- Never say `You are registered`, `You can vote by mail`, or `You have the correct ID` unless an official transaction has confirmed that exact claim. The MVP links users to official checks.

## 8. Accessibility requirements

The target is WCAG 2.2 Level AA across responsive web and equivalent native behavior. This is a release criterion, not a post-launch enhancement.

### Interaction and structure

- Every control has an accessible name, role, state, and error relationship.
- Native screen headings form a useful reading order; web headings do not skip levels for styling.
- Focus follows route changes, returns to the invoking control after dialogs, remains visible, and is not obscured by sticky UI.
- All web behavior is keyboard operable. Drag, swipe, and long-press interactions have single-pointer alternatives.
- Compact touch targets are at least 44 by 44 logical px; web targets also satisfy WCAG 2.2 target-size requirements.
- Bottom navigation, status badges, cards, and accordions expose selected/expanded state programmatically.
- Countdown announcements are not live regions. Only a user-initiated refresh or a material data update may trigger a restrained status announcement.

### Perception

- Normal text meets 4.5:1 contrast; large text and essential graphical objects meet 3:1.
- Information is never communicated by color, spatial placement, icon, or sound alone.
- Text supports at least 200% text scaling without clipping on native platforms and 400% zoom/reflow on web.
- Candidate order remains logical in the accessibility tree and visual layout.
- Decorative images are hidden from assistive technology; meaningful icons have localized alternatives.
- Motion honors reduced-motion settings. No essential interaction depends on animation.

### Forms and cognitive accessibility

- Address fields use persistent labels, platform autofill hints, example formats, and specific inline errors.
- Previously entered values remain available after validation errors and connectivity failures.
- Instructions are adjacent to the relevant control, not provided only in placeholders.
- Destructive actions state what will be removed and require confirmation. The final confirmation action is named `Delete local app data`, not `Continue`.
- Time-limited UI is not used. Session expiry and CAPTCHAs are outside the local-first MVP.

### Minimum manual test matrix

- iOS VoiceOver with large text and reduced motion.
- Android TalkBack with font/display scaling and switch-style keyboard navigation where supported.
- Web with keyboard only, Windows screen reader, 400% zoom, high-contrast/forced-colors mode, and browser text spacing overrides.
- English and Spanish at the largest supported text size on the smallest supported width.

Reference: [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/).

## 9. English and Spanish localization

- Language is the first onboarding choice and is always changeable under Settings.
- Use a locale-aware message system; no user-facing copy is assembled by concatenating translated fragments.
- Dates use the selected language and explicit month names where space allows. Never expose source-format timestamps.
- Store canonical enum and identifier values; translate only at presentation time.
- Layouts tolerate at least 35% text expansion without truncating actions, status labels, or legal/privacy copy.
- A bilingual election-domain reviewer approves registration, mail-voting, eligibility, ID, deadline, and ballot terminology.
- Official source content may open in only one language. Label that before navigation: `Official source — English only` / `Fuente oficial — solo en inglés`.
- Do not machine-translate candidate names, party names, agency names, legal citations, addresses, or URLs.
- Accessibility labels, notification copy, errors, empty states, and OS permission pre-prompts are part of the translation inventory.

The Expo implementation should use device locale APIs only to propose a default. The user's explicit app-language selection wins.

## 10. Address, eligibility, and privacy contract

### Before entry

The address explanation must state:

- purpose: resolve the districts and elections that apply;
- transmission: the address is sent over HTTPS to the selected resolution provider;
- storage: the full address remains on the user's device after resolution;
- remote retention: the app does not intentionally store the address in a Voter-operated backend in the MVP;
- controls: the user can change the address or delete all local app data;
- limitation: the app is informational and is not a voter-registration status check.

Do not state that an address `never leaves the device`, because address resolution may require a third-party request. Provider-specific privacy language cannot be finalized until decision `ADDR-01` is closed.

### Saved profile

The local profile contains:

- normalized display address;
- address resolution timestamp and provider;
- state, county, congressional district, state senate district, and state house district when available;
- eligibility attestation value (`ELIGIBLE`, `PREPARING`, or `PREFER_NOT_TO_SAY`);
- app language and notification preferences.

The eligibility answer changes explanatory content only. It must not suppress election information or determine legal eligibility.

### Deletion and change

- `Change address` re-runs resolution, previews the jurisdiction changes, and asks for confirmation before replacing the active profile.
- On confirmation, reminders for the previous jurisdiction are canceled and relevant reminders are recalculated.
- `Delete local app data` removes the full profile, cached personalized associations, read/unread history, and scheduled local notifications, then returns to language selection.
- Static public election files may remain in an unassociated cache; no profile key may remain attached to them.

## 11. Provenance and data-state model

Every actionable fact includes its status. Status is computed from source metadata, never from visual components.

| State | User-facing treatment | Allowed action |
| --- | --- | --- |
| `VERIFIED` | Source and `Verified [date]` | Normal actions and reminders |
| `CHANGED` | Information banner describing old and new values | Reminders are recalculated after the update is applied |
| `STALE` | Caution banner and last verification date | Official link remains available; new reminder scheduling follows the approved freshness policy |
| `INCOMPLETE` | Missing-content explanation naming what is unavailable | Never imply the list or requirement is complete |
| `CONFLICTING` | High-prominence warning naming conflicting authorities | Do not schedule a reminder for the disputed fact until resolved |
| `UNAVAILABLE` | Retry and official-source path | Preserve last known data only when clearly labeled |

Source hierarchy follows the high-level architecture plan. A third-party value cannot silently replace a conflicting official state, county, District of Columbia, or federal source value.

## 12. UI-facing data contracts

The normalized dataset may contain more fields, but screens consume explicit view models. Canonical datetimes use ISO 8601 and include a timezone or UTC offset. Presentation strings do not cross the data/UI boundary.

```ts
type Locale = 'en-US' | 'es-US';
type DataStatus =
  | 'VERIFIED'
  | 'CHANGED'
  | 'STALE'
  | 'INCOMPLETE'
  | 'CONFLICTING'
  | 'UNAVAILABLE';

interface JurisdictionProfile {
  displayAddress: string;
  stateCode: string;
  county?: string;
  congressionalDistrict?: string;
  stateSenateDistrict?: string;
  stateHouseDistrict?: string;
  resolvedAt: string;
  resolutionProvider: string;
}

interface SourceCitation {
  providerName: string;
  sourceUrl: string;
  authorityLevel: 'STATE_LOCAL' | 'FEDERAL' | 'OFFICIAL_LEGISLATIVE' | 'FEC' | 'AGGREGATOR';
  retrievedAt: string;
  verifiedAt?: string;
  language?: 'en' | 'es';
}

interface DataFreshness {
  status: DataStatus;
  lastVerifiedAt?: string;
  changedAt?: string;
  summaryMessageKey?: string;
  citations: SourceCitation[];
}

interface DeadlineView {
  id: string;
  type: 'REGISTRATION' | 'EARLY_VOTING_START' | 'EARLY_VOTING_END' |
    'MAIL_BALLOT_REQUEST' | 'MAIL_BALLOT_RETURN' | 'ELECTION_DAY';
  occursAt: string;
  timezone: string;
  methodQualifier?: 'RECEIVED_BY' | 'POSTMARKED_BY' | 'IN_PERSON_BY';
  freshness: DataFreshness;
}

interface ElectionSummaryView {
  id: string;
  name: string;
  type: 'PRIMARY' | 'PRIMARY_RUNOFF' | 'GENERAL' | 'SPECIAL' | 'RUNOFF';
  levels: Array<'FEDERAL' | 'STATE'>;
  electionDay: DeadlineView;
  nextAction?: DeadlineView;
  jurisdictionLabel: string;
  contestCount?: number;
  completeness: DataFreshness;
}

interface CandidateListEntryView {
  id: string;
  name: string;
  partyLabel?: string;
  incumbent?: boolean;
  officialCampaignUrl?: string;
  ballotOrder?: number;
  filingCitation: SourceCitation;
}

interface RequirementView {
  id: string;
  category: 'REGISTRATION' | 'IN_PERSON_ID' | 'MAIL_VOTING' | 'ACCESSIBILITY';
  summaryMessageKey: string;
  detailMessageKey: string;
  freshness: DataFreshness;
}

interface NotificationPreferencesView {
  localNotificationsEnabled: boolean;
  registrationDeadlines: boolean;
  earlyVoting: boolean;
  mailVoting: boolean;
  electionDay: boolean;
  offsetsInDays: number[];
}
```

## 13. Measurement constraints

The MVP works without analytics. If analytics is approved later:

- no address, district combination smaller than a state, candidate name, campaign URL, source URL query string, eligibility response, or free-form text may be emitted;
- event names describe product operation, not political behavior;
- candidate views and outbound campaign-site clicks are not profiled or used for personalization;
- telemetry is disclosed and can be disabled;
- crash reports are scrubbed of route parameters and local database values.

`PRIV-02` in the decision register must be closed before adding any telemetry SDK.

## 14. Authoritative design references

- [U.S. Election Assistance Commission state voting directory](https://www.eac.gov/voters/register-and-vote-in-your-state)
- [U.S. Census Geocoder](https://geocoding.geo.census.gov/geocoder/)
- [Google Civic Information voterInfoQuery](https://developers.google.com/civic-information/docs/v2/elections/voterInfoQuery)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo localization guidance](https://docs.expo.dev/guides/localization/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
