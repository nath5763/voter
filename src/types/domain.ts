export type AppLocale = 'en-US' | 'es-US';
export type Eligibility = 'ELIGIBLE' | 'PREPARING' | 'PREFER_NOT_TO_SAY';
export type DataStatus = 'VERIFIED' | 'CHANGED' | 'STALE' | 'INCOMPLETE' | 'CONFLICTING' | 'UNAVAILABLE';
export type CompletenessStatus = 'COMPLETE' | 'INCOMPLETE' | 'UNAVAILABLE';
export type ElectionType = 'GENERAL' | 'PRIMARY' | 'PRIMARY_RUNOFF' | 'RUNOFF' | 'SPECIAL';

export interface AddressInput {
  street: string;
  unit?: string;
  city: string;
  stateCode: string;
  zipCode: string;
}

export interface JurisdictionProfile {
  fullAddress?: AddressInput;
  displayAddress?: string;
  maskedAddress: string;
  city: string;
  stateCode: string;
  stateName: string;
  zipCode: string;
  county: string;
  countyFips?: string;
  congressionalDistrict: string;
  upperLegislativeDistrict?: string;
  lowerLegislativeDistrict?: string;
  upperChamberLabel?: string;
  lowerChamberLabel?: string;
  resolvedAt: string;
  resolutionProvider: 'US_CENSUS_GEOCODER';
  censusBenchmark?: string;
  censusVintage?: string;
  civicElectionId?: string;
}

export interface UserProfile {
  locale: AppLocale;
  eligibility: Eligibility;
  jurisdiction: JurisdictionProfile;
  remindersEnabled: boolean;
  onboardingCompletedAt: string;
}

export interface SourceCitation {
  id: string;
  providerName: string;
  url: string;
  retrievedAt?: string;
  verifiedAt?: string;
  language: 'en' | 'es';
  authorityLevel: 'STATE' | 'FEDERAL' | 'OFFICIAL_LEGISLATIVE' | 'AGGREGATOR';
  official: boolean;
  status?: DataStatus;
}

export interface Deadline {
  id: string;
  type: 'REGISTRATION' | 'EARLY_START' | 'EARLY_END' | 'MAIL_REQUEST' | 'MAIL_RETURN' | 'ELECTION_DAY';
  date: string;
  time?: string;
  timeZone?: string;
  qualifier?: 'RECEIVED_OR_POSTMARKED' | 'RECEIVED_BY' | 'POSTMARKED_BY' | 'IN_PERSON_BY' | 'DATE_ONLY';
  status: DataStatus;
  sourceIds: string[];
  previousDate?: string;
}

export interface Requirement {
  id: string;
  type: 'REGISTRATION' | 'VOTER_ID' | 'EARLY_VOTING' | 'MAIL_VOTING';
  title: string;
  summary: string;
  status: DataStatus;
  sourceIds: string[];
}

export interface Candidate {
  id: string;
  name: string;
  party?: string;
  incumbent?: boolean;
  ballotOrder?: number;
  ballotStatus?: 'ACTIVE' | 'WITHDRAWN' | 'DISQUALIFIED';
  campaignUrl?: string;
  sourceIds: string[];
}

export interface Contest {
  id: string;
  office: string;
  level: 'FEDERAL' | 'STATE' | 'DC_WIDE';
  district?: string;
  orderStatus: 'OFFICIAL' | 'ALPHABETICAL_FALLBACK' | 'UNAVAILABLE';
  completeness: CompletenessStatus;
  candidates: Candidate[];
  sourceIds: string[];
}

export interface Election {
  id: string;
  stateCode: string;
  name: string;
  type: ElectionType;
  date: string;
  timeZone: string;
  jurisdiction: string;
  status: DataStatus;
  completeness: CompletenessStatus;
  deadlines: Deadline[];
  requirements: Requirement[];
  contests: Contest[];
  sourceIds: string[];
}

export interface JurisdictionDataset {
  schemaVersion: number;
  datasetVersion: string;
  generatedAt: string;
  stateCode: string;
  stateName: string;
  status: DataStatus;
  elections: Election[];
  sources: SourceCitation[];
}

export interface DatasetManifestEntry {
  version: string;
  url: string;
  sha256?: string;
  status: DataStatus;
}

export interface DatasetManifest {
  schemaVersion: number;
  datasetVersion: string;
  generatedAt: string;
  federal: DatasetManifestEntry;
  jurisdictions: Record<string, DatasetManifestEntry>;
}

export interface NotificationRecord {
  id: string;
  type: 'DATASET_UPDATED' | 'FACT_CHANGED' | 'DATA_WARNING' | 'REMINDER_HISTORY';
  title: string;
  message: string;
  electionId?: string;
  route?: string;
  status: DataStatus;
  createdAt: string;
  readAt?: string;
}

export interface ReminderRecord {
  id: string;
  expoIdentifier: string;
  electionId: string;
  deadlineId: string;
  datasetVersion: string;
  triggerAt: string;
  locale: AppLocale;
  category: Deadline['type'];
}

export type JurisdictionResolution =
  | { status: 'success'; jurisdiction: JurisdictionProfile }
  | { status: 'ambiguous'; message: string }
  | { status: 'unsupported'; message: string }
  | { status: 'offline'; message: string }
  | { status: 'provider-error'; message: string };
