export type AppLocale = 'en-US' | 'es-US';
export type Eligibility = 'ELIGIBLE' | 'PREPARING' | 'PREFER_NOT_TO_SAY';
export type DataStatus = 'VERIFIED' | 'CHANGED' | 'STALE' | 'INCOMPLETE' | 'CONFLICTING' | 'UNAVAILABLE';

export interface JurisdictionProfile {
  street: string;
  unit?: string;
  city: string;
  state: 'TX';
  zipCode: string;
  displayAddress: string;
  county: string;
  congressionalDistrict: string;
  stateSenateDistrict: string;
  stateHouseDistrict: string;
  resolvedAt: string;
  resolutionProvider: 'DEVELOPMENT_FIXTURE';
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
  verifiedAt?: string;
  language: 'en' | 'es';
  official: boolean;
}

export interface Deadline {
  id: string;
  type: 'REGISTRATION' | 'EARLY_START' | 'EARLY_END' | 'MAIL_REQUEST' | 'ELECTION_DAY';
  date: string;
  qualifier?: 'RECEIVED_OR_POSTMARKED' | 'RECEIVED_BY' | 'DATE_ONLY';
  status: DataStatus;
  sourceId: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  incumbent: boolean;
  ballotOrder: number;
  campaignUrl?: string;
  sourceId: string;
}

export interface Contest {
  id: string;
  office: string;
  level: 'FEDERAL' | 'STATE';
  district: string;
  orderStatus: 'SAMPLE' | 'OFFICIAL' | 'ALPHABETICAL_FALLBACK';
  candidates: Candidate[];
}

export interface Election {
  id: string;
  name: string;
  type: 'GENERAL' | 'PRIMARY' | 'RUNOFF' | 'SPECIAL';
  date: string;
  jurisdiction: string;
  status: DataStatus;
  deadlines: Deadline[];
  contests: Contest[];
  sourceIds: string[];
}
