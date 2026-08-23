import { getState } from '@/data/states';
import type { AddressInput, JurisdictionProfile, JurisdictionResolution } from '@/types/domain';

const CENSUS_ENDPOINT = 'https://geocoding.geo.census.gov/geocoder/geographies/address';
const CIVIC_ENDPOINT = 'https://www.googleapis.com/civicinfo/v2';

interface CensusGeography {
  NAME?: string;
  BASENAME?: string;
  GEOID?: string;
  COUNTY?: string;
}

interface CensusMatch {
  matchedAddress?: string;
  addressComponents?: { city?: string; state?: string; zip?: string };
  geographies?: Record<string, CensusGeography[]>;
}

function findGeography(geographies: Record<string, CensusGeography[]>, includes: string) {
  const entry = Object.entries(geographies).find(([key]) => key.toLowerCase().includes(includes.toLowerCase()));
  return entry?.[1]?.[0];
}

function districtLabel(value: CensusGeography | undefined, prefix: string) {
  const raw = value?.BASENAME ?? value?.NAME;
  if (!raw) return undefined;
  const normalized = raw.replace(/^Congressional District\s*/i, '').replace(/^State Legislative District\s*/i, '').trim();
  if (normalized === '00' || /at large/i.test(normalized)) return `${prefix} at-large`;
  return `${prefix} ${normalized.replace(/^0+(?=\d)/, '')}`;
}

async function lookupCivicElection(address: AddressInput): Promise<string | undefined> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_CIVIC_API_KEY;
  if (!apiKey) return undefined;
  const electionsResponse = await fetch(`${CIVIC_ENDPOINT}/elections?key=${encodeURIComponent(apiKey)}`);
  if (!electionsResponse.ok) return undefined;
  const payload = await electionsResponse.json() as { elections?: { id: string; electionDay: string }[] };
  const today = new Date().toISOString().slice(0, 10);
  const election = payload.elections?.filter((item) => item.electionDay >= today).sort((a, b) => a.electionDay.localeCompare(b.electionDay))[0];
  if (!election) return undefined;
  const formatted = `${address.street}${address.unit ? ` ${address.unit}` : ''}, ${address.city}, ${address.stateCode} ${address.zipCode}`;
  const query = new URLSearchParams({ key: apiKey, address: formatted, electionId: election.id, officialOnly: 'true' });
  const response = await fetch(`${CIVIC_ENDPOINT}/voterinfo?${query.toString()}`);
  return response.ok ? election.id : undefined;
}

export async function resolveJurisdiction(input: AddressInput): Promise<JurisdictionResolution> {
  const address: AddressInput = {
    street: input.street.trim(), unit: input.unit?.trim() || undefined, city: input.city.trim(),
    stateCode: input.stateCode.trim().toUpperCase(), zipCode: input.zipCode.trim(),
  };
  const state = getState(address.stateCode);
  if (!state || !address.street || !address.city || !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
    return { status: 'unsupported', message: 'Enter a complete residential address in one of the 50 states or Washington, DC.' };
  }
  if (/^\s*(p\.?\s*o\.?|post office)\s+box\b/i.test(address.street)) {
    return { status: 'unsupported', message: 'PO boxes do not identify voting districts. Enter a physical residential address.' };
  }

  const query = new URLSearchParams({
    street: address.street, city: address.city, state: address.stateCode, zip: address.zipCode,
    benchmark: 'Public_AR_Current', vintage: 'Current_Current', format: 'json',
  });
  try {
    const response = await fetch(`${CENSUS_ENDPOINT}?${query.toString()}`);
    if (!response.ok) return { status: 'provider-error', message: `The Census address service returned ${response.status}. Try again later.` };
    const payload = await response.json() as { result?: { addressMatches?: CensusMatch[]; input?: { benchmark?: { benchmarkName?: string }; vintage?: { vintageName?: string } } } };
    const matches = payload.result?.addressMatches ?? [];
    if (matches.length === 0) return { status: 'unsupported', message: 'The address could not be resolved. Check the street, city, state, and ZIP code.' };
    if (matches.length > 1) return { status: 'ambiguous', message: 'More than one address matched. Add an apartment or directional detail and try again.' };
    const match = matches[0];
    const components = match.addressComponents ?? {};
    if (components.state && components.state !== state.code) return { status: 'unsupported', message: 'The normalized address did not match the selected state.' };
    const geographies = match.geographies ?? {};
    const county = findGeography(geographies, 'counties');
    const congressional = findGeography(geographies, 'congressional districts');
    const upper = findGeography(geographies, 'legislative districts - upper');
    const lower = findGeography(geographies, 'legislative districts - lower');
    const civicElectionId = await lookupCivicElection(address).catch(() => undefined);
    const city = components.city ?? address.city;
    const zipCode = components.zip ?? address.zipCode;
    const displayAddress = match.matchedAddress ?? `${address.street}, ${city}, ${state.code} ${zipCode}`;
    const jurisdiction: JurisdictionProfile = {
      fullAddress: address,
      displayAddress,
      maskedAddress: `${city}, ${state.code} ${zipCode.slice(0, 3)}…`,
      city,
      stateCode: state.code,
      stateName: state.name,
      zipCode,
      county: county?.NAME ?? 'County not returned',
      countyFips: county?.GEOID ?? county?.COUNTY,
      congressionalDistrict: state.code === 'DC' ? 'District of Columbia at-large' : districtLabel(congressional, 'U.S. House District') ?? 'Congressional district unavailable',
      upperLegislativeDistrict: districtLabel(upper, state.upperChamberLabel ?? 'Upper legislative district'),
      lowerLegislativeDistrict: districtLabel(lower, state.lowerChamberLabel ?? 'Lower legislative district'),
      upperChamberLabel: state.upperChamberLabel,
      lowerChamberLabel: state.lowerChamberLabel,
      resolvedAt: new Date().toISOString(),
      resolutionProvider: 'US_CENSUS_GEOCODER',
      censusBenchmark: payload.result?.input?.benchmark?.benchmarkName,
      censusVintage: payload.result?.input?.vintage?.vintageName,
      civicElectionId,
    };
    return { status: 'success', jurisdiction };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'offline', message: message.includes('Network') ? 'No network connection. Your address was not changed.' : 'The address service is unavailable. Try again later.' };
  }
}
