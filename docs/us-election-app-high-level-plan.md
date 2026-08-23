# U.S. Election Cycle App — High-Level Product & Architecture Plan

## 1. Purpose

Build a cross-platform application that helps U.S. voters keep track of upcoming state and federal elections, understand important voting dates and requirements, review factual candidate information, and receive reminders before relevant deadlines and election dates.

The product should prioritize:

- Factual, source-attributed election information
- Nonpartisan presentation
- User privacy
- Minimal infrastructure
- Cross-platform support
- Reliable reminders before important election events
- Clear separation between official facts and any third-party aggregated data

The initial product should focus on **state and federal elections**. Local elections, ballot initiatives, judicial races, school boards, and other local contests can be added later.

---

# 2. Core User Experience

Detailed UI planning is maintained separately:

- [UI/UX Foundations](ui-ux-foundations.md) defines the audience, product principles, information architecture, privacy contract, neutrality rules, accessibility, localization, responsive behavior, and UI-facing data contracts.
- [UI Screen and Flow Specification](ui-screen-flow-spec.md) defines routes, end-to-end flows, screen behavior, annotated wireframes, shared components, failure states, and acceptance scenarios.
- [Pre-implementation Decisions and Readiness](pre-implementation-decisions.md) records implementation blockers, provisional defaults, deferred scope, validation artifacts, and the definition of ready.

If these UI documents conflict with this high-level plan, the conflict must be resolved explicitly rather than selecting one silently. The initial experience is mobile-first and bilingual, requires residential-address onboarding, stores the profile locally, and supports all 50 states plus Washington, DC.

## 2.1 User Profile

A user creates a voting profile containing enough information to determine which elections are relevant to them.

Initial profile fields:

```text
UserProfile
-----------
id
name
address
state
zipCode
age / eligibility status
email
notificationPreferences
```

### Privacy Recommendation

The application should minimize storage of personally identifiable information.

Prefer:

```text
Device
  stores:
    name
    full address
    age / date of birth
    email preferences
```

After resolving the user's jurisdiction, the application can derive:

```text
state
congressionalDistrict
stateSenateDistrict
stateHouseDistrict
county
```

If a backend is eventually introduced, it should generally store the derived jurisdiction identifiers instead of the user's full street address whenever possible.

For age, avoid collecting a full date of birth unless it is actually needed. An `18+` eligibility indicator or birth year may be sufficient.

---

# 3. Election Information

The application should maintain information about upcoming elections affecting the user's state and federal representation.

## 3.1 Election Record

```text
Election
--------
id
name
type
level
state
jurisdiction
electionDate
earlyVotingStart
earlyVotingEnd
registrationDeadline
mailBallotRequestDeadline
mailBallotReturnDeadline
sourceUrl
lastVerifiedAt
lastUpdatedAt
```

Possible election types:

```text
PRIMARY
PRIMARY_RUNOFF
GENERAL
SPECIAL
RUNOFF
```

Possible election levels:

```text
FEDERAL
STATE
LOCAL     // future
```

---

# 4. Election Details Presented to Users

Each election page should display:

- Election name
- Election date
- Election type
- Registration deadline
- Early voting period
- Mail/absentee ballot deadlines
- Voting requirements
- State-specific voter ID requirements
- Registration requirements
- Official election website
- Offices being elected
- Candidates
- Source of each important fact
- Date the information was last verified

Example:

```text
Texas General Election

Election Day
November 3, YYYY

Registration Deadline
October X, YYYY

Early Voting
October X – October X

Federal Races
- U.S. Senate
- U.S. House District XX

State Races
- Governor
- State Senate District XX
- State House District XX

Sources
- Texas Secretary of State
- U.S. Election Assistance Commission

Last verified
YYYY-MM-DD
```

The system should never rely only on a calculated election cycle when an official election source is available.

---

# 5. National / Federal Election Information

The application should also provide a national election view.

Federal election coverage should include:

- President / Vice President
- U.S. Senate
- U.S. House of Representatives

Users should be able to view:

```text
National Elections
    |
    +-- Presidential Election
    |
    +-- U.S. Senate Elections
    |      |
    |      +-- State
    |
    +-- U.S. House Elections
           |
           +-- State
                  |
                  +-- Congressional District
```

This allows the app to support both:

1. A personalized "elections affecting me" experience.
2. A nationwide election calendar for users who want to follow elections outside their own state.

---

# 6. Candidate Information

Candidate information should remain factual and source-attributed.

Initial candidate fields:

```text
Candidate
---------
id
name
party
office
state
district
incumbent
officialCampaignUrl
filingSourceUrl
photoUrl
```

Future factual information can include:

- Previous elected offices
- Election history
- Federal campaign finance information
- Legislative voting history for incumbents
- Official candidate filings
- Links to official campaign websites

Avoid automatically assigning subjective labels such as:

```text
moderate
extreme
pro-business
anti-business
progressive
conservative
```

If the application later categorizes legislation by subject, use neutral categories such as:

```text
Agriculture
Defense
Healthcare
Education
Transportation
Taxation
```

and always allow the user to inspect the underlying bill and vote.

---

# 7. Primary Election Data Sources

There is no single authoritative API covering every U.S. election, deadline, candidate, voting requirement, and jurisdiction.

The application should therefore use a **source hierarchy**.

## 7.1 State and Local Election Authorities — Primary Source

Each state's official election authority should be considered the primary source for:

- Election dates
- Registration deadlines
- Early voting dates
- Mail ballot rules
- Voter identification requirements
- State election requirements
- Official candidate lists
- State-specific election notices

The U.S. Election Assistance Commission provides a directory and summaries linking users to official state election authorities:

- https://www.eac.gov/voters/register-and-vote-in-your-state
- https://www.eac.gov/election-officials/eac-ncsl-state-election-profiles

The application should preserve the original official source URL whenever information is imported.

---

## 7.2 Google Civic Information API

Google's Civic Information API can return election information for a supplied address during supported elections.

Documentation:

- https://developers.google.com/civic-information
- https://developers.google.com/civic-information/docs/v2/elections/voterInfoQuery
- https://developers.google.com/civic-information/docs/data_guidelines

Potential information includes:

- Elections
- Polling places
- Early voting locations
- Contests
- Candidates
- Election officials
- Address-specific ballot information

This is especially useful for resolving a residential address to contests that apply to that voter.

### Important Limitation

The API only provides voting information for elections supported by the Voting Information Project, so it should not be the application's only election source.

Google also publishes caching/data-use requirements. The application or ingestion pipeline must follow those requirements.

---

# 8. Candidate and Legislative Data Sources

## 8.1 Federal Election Commission

Use the FEC API for federal candidate and campaign-finance information.

Documentation:

- https://api.open.fec.gov/developers/
- https://www.fec.gov/data/

Useful information includes:

- Candidate registrations
- Committees
- Contributions
- Receipts
- Expenditures
- Campaign filings

Use the FEC candidate ID as one of the external identifiers associated with federal candidates.

---

## 8.2 Congress.gov

Congress.gov provides an official API for congressional information.

Documentation:

- https://api.congress.gov/

Potential uses:

- Congressional members
- Bills
- House roll-call votes
- Legislative metadata

This can be used to connect an incumbent candidate to the legislation on which they have voted.

---

## 8.3 U.S. Senate Roll-Call Data

The Senate publishes official roll-call records and XML feeds.

Sources:

- https://www.senate.gov/votes/
- https://www.senate.gov/general/XML.htm

Use these records for factual Senate voting histories.

---

## 8.4 U.S. House Roll-Call Data

The Clerk of the U.S. House publishes official roll-call records.

Source:

- https://clerk.house.gov/Votes

When official House vote data is available through Congress.gov, prefer the structured API and retain the Clerk record as the official provenance URL.

---

## 8.5 State Legislative Records

State legislative data is fragmented across individual state legislatures.

Open States provides a normalized state legislative API:

- https://docs.openstates.org/api-v3/
- https://openstates.org/downloads/

Potential information includes:

- State legislators
- Bills
- Legislative sessions
- Votes

When using Open States, preserve links or identifiers for the underlying state legislative source whenever available.

---

# 9. Data Provenance

Every imported election fact should carry provenance.

Example:

```text
DataSource
----------
id
provider
sourceUrl
retrievedAt
lastVerifiedAt
authorityLevel
```

Example election deadline:

```text
Registration Deadline
October X, YYYY

Source:
Texas Secretary of State

Retrieved:
YYYY-MM-DD

Last verified:
YYYY-MM-DD
```

Recommended authority order:

```text
1. State/local election authority
2. Federal government source
3. Official legislative body
4. FEC
5. Google Civic Information API
6. Open States
7. Other vetted aggregators
```

Third-party aggregators should not silently overwrite conflicting official information.

---

# 10. Recommended Architecture

There are two realistic architectures.

---

# Option A — Local-First / No Traditional Backend

This should be the preferred MVP architecture.

```text
             Public Election Sources
                       |
                       v
              Data Import Scripts
                       |
                       v
               Static JSON Dataset
                       |
                       v
            GitHub Pages / Static Host
                       |
                       v
+---------------------------------------------+
|           React Native / Expo App           |
|                                             |
|  SQLite                                     |
|  User Profile                               |
|  Election Cache                             |
|  Notification History                       |
|  Local Notification Scheduler               |
+---------------------------------------------+
```

The application contains no central user database.

User data remains on the user's device.

## Data Distribution

A scheduled ingestion process produces static files such as:

```text
/data/elections/index.json
/data/elections/2026.json

/data/states/tx/elections.json
/data/states/ca/elections.json

/data/candidates/federal.json
```

The application periodically downloads these files.

The static dataset can be hosted using:

- GitHub Pages
- GitHub Releases
- A static CDN
- Any simple HTTPS file host

There is no runtime application server or database.

### Data Import Job

A scheduled CI job can:

```text
Fetch sources
    ↓
Validate data
    ↓
Normalize records
    ↓
Compare against previous version
    ↓
Generate JSON
    ↓
Publish static files
```

GitHub Actions is sufficient for an MVP, although the same scripts could be run from another CI system or a self-hosted machine.

---

# 11. Local Database

Use SQLite on the device.

With Expo:

- https://docs.expo.dev/versions/latest/sdk/sqlite/

Suggested tables:

```text
user_profile

jurisdiction

election

contest

candidate

deadline

requirement

data_source

notification

notification_preference
```

SQLite can contain:

- User profile
- Cached election information
- Notification schedule
- Notification history
- User settings
- Favorite elections/states

No hosted relational database is required in Option A.

---

# 12. Notifications Without a Backend

Expo supports local notifications:

- https://docs.expo.dev/push-notifications/what-you-need-to-know/

Once election information has been downloaded, the app can schedule notifications directly on the device.

Example:

```text
Election Date: November 3

Schedule locally:

60 days before
30 days before
registration deadline - 7 days
registration deadline - 1 day
early voting - 1 day
Election Day - 1 day
Election Day - morning
```

If an election date changes, the application:

```text
downloads new election data
        ↓
detects change
        ↓
cancels old local notifications
        ↓
creates new local notifications
```

This requires no notification server.

---

# 13. In-App Notifications

In-app notifications can also be completely local.

Example table:

```text
Notification
------------
id
type
title
message
electionId
createdAt
readAt
priority
```

When the app downloads a new dataset, it compares the current data against the previous version.

Example:

```text
Previous registration deadline:
October 5

New registration deadline:
October 7
```

The app generates:

```text
Election information updated

The voter registration deadline for
[State / Election] has changed.

View details
```

---

# 14. The Email Problem

Automatic email is the main requirement that prevents the entire system from being backend-free.

A mobile application should **not** contain an email-provider API secret.

Therefore automated email requires a trusted server-side component.

Possible providers:

- Amazon SES
- Postmark
- Resend
- SendGrid

Example Resend API documentation:

- https://resend.com/docs/api-reference/emails/send-email

The backend would store at minimum:

```text
EmailSubscription
-----------------
id
email
state
district
notificationPreferences
verified
createdAt
```

The backend does **not** need to store the full residential address.

---

# 15. True Remote Push Notifications

There is an important distinction between:

### Local Notification

```text
App downloads election date
        ↓
Phone schedules notification
        ↓
Phone displays notification later
```

No backend required.

### Remote Push Notification

```text
Backend detects election update
        ↓
Backend sends push message
        ↓
Expo / FCM / APNs
        ↓
Phone
```

A remote push system requires a server-side sender.

Expo's push notification documentation:

- https://docs.expo.dev/push-notifications/push-notifications-setup/
- https://docs.expo.dev/push-notifications/sending-notifications/

For the MVP, local notifications should be sufficient for scheduled election reminders.

Remote push can be introduced later for:

- Deadline changes
- Emergency election notices
- Polling-location changes
- Newly published candidate information
- Important state election updates

---

# 16. Option B — Minimal Backend

If email and remote push are required from the first release, use a small backend.

```text
                      Election Sources
                            |
                            v
                    Data Ingestion Job
                            |
                            v
                       PostgreSQL
                            |
                            v
                       REST API
                      /         \
                     /           \
                    v             v
            Mobile / Web      Notification Job
                                  |
                         +--------+--------+
                         |                 |
                         v                 v
                     Email API         Push API
```

Suggested backend responsibilities:

```text
Election ingestion
Election normalization
Election API
Email subscriptions
Device push tokens
Notification scheduling
Data provenance
```

Avoid putting UI-specific logic in the backend.

---

# 17. Minimal Backend Database

If Option B is required:

```text
user
----
id
email
state
congressional_district
created_at
```

```text
device
------
id
user_id
push_token
platform
last_seen_at
```

```text
notification_preference
-----------------------
user_id
email_enabled
push_enabled
state_updates
national_updates
deadline_updates
```

```text
election
candidate
contest
deadline
requirement
data_source
```

The backend should avoid storing the user's street address after jurisdiction resolution unless there is a specific reason to retain it.

---

# 18. Recommended Hybrid Architecture

The best long-term compromise is:

```text
             STATIC ELECTION DATA
                     |
                     v
             Mobile Application
             /              \
            /                \
       SQLite             Tiny Backend
                            |
                    +-------+-------+
                    |               |
                  Email          Remote Push
```

### Store locally

```text
Name
Address
Age / eligibility
Election cache
Notification history
Preferences
```

### Store remotely only when necessary

```text
Email
Anonymous user/device ID
Push token
State
District identifiers
Notification preferences
```

This prevents the central service from becoming a database of voter names and home addresses.

---

# 19. Recommended Cross-Platform Stack

## Application

```text
React Native
Expo
TypeScript
```

Targets:

```text
iOS
Android
Web
```

Useful packages:

```text
expo-router
expo-sqlite
expo-notifications
expo-secure-store
zod
```

Possible state management:

```text
Zustand
or
Redux Toolkit
```

Use whichever best fits the project; a large state-management framework is not required for the first version.

---

# 20. Data Pipeline Dependencies

Recommended:

```text
Python or TypeScript ingestion scripts
GitHub Actions
JSON Schema / Zod validation
Static JSON output
```

The ingestion layer should be independent from the mobile application.

Example repository structure:

```text
election-app/
|
+-- app/
|   +-- src/
|
+-- data-pipeline/
|   +-- sources/
|   +-- parsers/
|   +-- normalization/
|   +-- validation/
|
+-- data/
|   +-- elections/
|   +-- states/
|   +-- candidates/
|
+-- schemas/
```

---

# 21. Normalized Data Model

A normalized model prevents each external API from leaking its structure into the application.

```text
Election
  |
  +-- Contest
         |
         +-- Office
         |
         +-- Candidate
```

Separate supporting objects:

```text
Election
  |
  +-- Deadline
  |
  +-- Requirement
  |
  +-- DataSource
```

Candidate information:

```text
Candidate
  |
  +-- ExternalIdentifier
  |
  +-- OfficeHistory
  |
  +-- LegislativeVote
  |
  +-- CampaignFinance
  |
  +-- DataSource
```

---

# 22. External Identifiers

Do not use a provider's ID as the application's primary key.

Instead:

```text
Candidate
---------
id = internal UUID
```

```text
ExternalIdentifier
------------------
candidateId
provider
externalId
```

Examples:

```text
FEC
Congress.gov
Google Civic
Open States
State Election Authority
```

This makes it possible to merge records from several sources.

---

# 23. Notification Rules

Initial notification types:

```text
ELECTION_ANNOUNCED

REGISTRATION_DEADLINE
REGISTRATION_DEADLINE_APPROACHING

EARLY_VOTING_START
EARLY_VOTING_END

MAIL_BALLOT_REQUEST_DEADLINE
MAIL_BALLOT_RETURN_DEADLINE

ELECTION_APPROACHING
ELECTION_TOMORROW
ELECTION_TODAY

ELECTION_INFORMATION_CHANGED
```

Default schedule could be configurable by the user.

Example:

```text
60 days before election
30 days before election
14 days before election
7 days before election
1 day before election
```

Deadline-specific reminders should take priority over generic countdown reminders.

---

# 24. User Notification Preferences

```text
NotificationPreferences
-----------------------
stateElections
federalElections

registrationDeadlines
earlyVoting
mailVoting
electionDay

localNotifications
remotePush
email

reminder60Days
reminder30Days
reminder14Days
reminder7Days
reminder1Day
```

Users should be able to disable any notification category independently.

---

# 25. Data Refresh Strategy

Suggested initial refresh frequency:

### General election calendar

```text
Daily
```

### Candidate lists

```text
Daily during active election periods
Weekly otherwise
```

### Voting requirements

```text
Weekly
and
Immediately before major election periods
```

### Legislative voting records

```text
Daily or weekly
```

The app does not necessarily need to download every feed every day.

The static dataset can include:

```text
datasetVersion
generatedAt
```

The app first checks the dataset manifest and downloads changed state files only.

---

# 26. Static Dataset Manifest

Example:

```json
{
  "version": "2026-08-19T20:00:00Z",
  "states": {
    "TX": {
      "version": "2026-08-19T18:15:00Z",
      "url": "/states/tx/elections.json"
    },
    "CA": {
      "version": "2026-08-19T17:10:00Z",
      "url": "/states/ca/elections.json"
    }
  }
}
```

This minimizes bandwidth and allows state data to update independently.

---

# 27. MVP Recommendation

## Phase 1 — Nationwide Election Calendar

Implementation scope: all 50 states plus Washington, DC. A valid domestic residential address in any supported jurisdiction must be viable; the app must never treat Texas as the default or only supported state. Territory, military, and overseas-address support requires a separate product decision.

Build:

- React Native / Expo application
- Local user profile
- State selection/address
- SQLite storage
- State election calendar
- Federal election calendar
- Registration deadlines
- Early voting dates
- Voting requirements
- Candidate names
- Official source links
- Local device notifications
- In-app notification center
- Address-to-county, congressional-district, and state-legislative-district resolution
- English and Spanish presentation
- Explicit incomplete/conflicting data states and publication gates

Infrastructure:

```text
Mobile app
SQLite
Static JSON
GitHub Actions
Static HTTPS hosting
```

No backend database.

---

# 28. Phase 2 — Advanced Candidate Data (separate after Phase 1 testing)

Phase 2 does not begin until Phase 1 automated checks and the documented native/web manual acceptance matrix pass. Basic candidate names, filing attributes, and official sources remain Phase 1 facts; enrichment and history belong here.

Add:

- Candidate details
- Incumbent identification
- Previous offices
- FEC identifiers
- Campaign finance
- House voting records
- Senate voting records
- State legislative voting records
- Source provenance

Sources:

```text
FEC
Congress.gov
House Clerk
U.S. Senate
Open States
```

---

# 29. Phase 3 — Email + Remote Push

Introduce the smallest possible backend.

Add:

- Email verification
- Email subscriptions
- Device registration
- Push tokens
- Remote election alerts
- Email reminders

Backend stores only:

```text
email
state
district
push token
notification preferences
```

Do not move the user's complete local profile to the server unless required.

---

# 30. Phase 4 — Local Personalized Ballot

Add:

- County elections
- Municipal elections
- School board elections
- Judicial elections
- Ballot measures

Google Civic Information API becomes especially useful at this stage.

---

# 31. Phase 5 — Advanced Candidate Records

Add factual candidate-history tools:

```text
Voting history
Bill history
Office history
Election history
Campaign finance
Official filings
```

All records should display their source.

The application should remain a factual election-information system rather than automatically recommending candidates.

---

# 32. MVP Architecture Summary

Recommended initial architecture:

```text
                     Official Sources
                           |
                           v
                  Data Ingestion Scripts
                           |
                           v
                   Normalized JSON Data
                           |
                           v
                      Static Host
                           |
                           v
                React Native / Expo
                  /             \
                 /               \
             SQLite          Notifications
                                |
                           Local Device
```

This gives the application:

- iOS support
- Android support
- Web potential
- User profiles
- State election tracking
- Federal election tracking
- Candidate information
- Election deadlines
- Local reminders
- In-app reminders

without requiring:

- Hosted PostgreSQL
- Hosted authentication
- A long-running API server
- A centralized database of home addresses

The first feature that clearly requires backend infrastructure is **automatic email**.

True server-generated remote push notifications are the second.

---

# 33. Recommended Initial Dependencies

## Required

```text
Node.js
TypeScript
React Native
Expo
expo-router
expo-sqlite
expo-notifications
expo-secure-store
zod
```

## Data Pipeline

```text
GitHub Actions
Python or Node.js
JSON / JSON Schema
HTTP client
HTML/XML parser where official APIs are unavailable
```

## External Data

```text
U.S. Election Assistance Commission
Official state election authorities
Google Civic Information API
Federal Election Commission API
Congress.gov API
U.S. Senate roll-call data
U.S. House Clerk voting data
Open States
```

## Optional Later

```text
PostgreSQL
Spring Boot / Node.js backend
Resend / Postmark / Amazon SES
Expo Push Service
Sentry
```

---

# 34. First Development Milestone

The first useful end-to-end version should do only this:

```text
1. Install app
2. Create local profile
3. Enter/select state and address
4. Determine relevant state/federal elections
5. Download current election dataset
6. Display next election
7. Display:
      election date
      registration deadline
      early voting
      requirements
      offices
      candidates
      official sources
8. Schedule local reminders
9. Show reminders in an in-app notification center
```

The Phase 1 application and data contract cover all 50 states plus Washington, DC from the outset. Each jurisdiction adapter must pass the same completeness, provenance, and release checks; an incomplete adapter remains visibly incomplete and blocks production data publication. The difficult part of this application is **data normalization and verification**, not the mobile UI.

---

# 35. Guiding Design Principle

The app should be able to answer four questions for a voter at any time:

```text
1. What election affects me next?

2. When do I need to do something?

3. What do I need in order to vote?

4. Who and what will be on the ballot?
```

Every answer should include enough provenance for the user to verify it against an official source.
