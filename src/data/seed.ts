import { US_JURISDICTIONS, getState } from '@/data/states';
import type { DatasetManifest, JurisdictionDataset, SourceCitation } from '@/types/domain';

export const SEED_VERSION = '2026.08.23-seed.1';
const GENERATED_AT = '2026-08-23T00:00:00Z';

const federalSource: SourceCitation = {
  id: 'eac-national',
  providerName: 'U.S. Election Assistance Commission',
  url: 'https://www.eac.gov/voters/register-and-vote-in-your-state',
  retrievedAt: GENERATED_AT,
  language: 'en',
  authorityLevel: 'FEDERAL',
  official: true,
  status: 'INCOMPLETE',
};

export function createSeedDataset(stateCode: string): JurisdictionDataset {
  const state = getState(stateCode);
  if (!state) throw new Error(`Unsupported jurisdiction: ${stateCode}`);
  const electionId = `${state.code.toLowerCase()}-federal-general-2026`;
  return {
    schemaVersion: 1,
    datasetVersion: SEED_VERSION,
    generatedAt: GENERATED_AT,
    stateCode: state.code,
    stateName: state.name,
    status: 'INCOMPLETE',
    sources: [federalSource],
    elections: [{
      id: electionId,
      stateCode: state.code,
      name: `${state.name} Federal General Election`,
      type: 'GENERAL',
      date: '2026-11-03',
      timeZone: state.timeZone,
      jurisdiction: state.name,
      status: 'INCOMPLETE',
      completeness: 'INCOMPLETE',
      deadlines: [{ id: `${electionId}-day`, type: 'ELECTION_DAY', date: '2026-11-03', qualifier: 'DATE_ONLY', status: 'VERIFIED', sourceIds: [federalSource.id] }],
      requirements: [],
      contests: [],
      sourceIds: [federalSource.id],
    }],
  };
}

export const seedManifest: DatasetManifest = {
  schemaVersion: 1,
  datasetVersion: SEED_VERSION,
  generatedAt: GENERATED_AT,
  federal: { version: SEED_VERSION, url: '/data/federal.json', status: 'INCOMPLETE' },
  jurisdictions: Object.fromEntries(US_JURISDICTIONS.map((state) => [
    state.code,
    { version: SEED_VERSION, url: `/data/states/${state.code.toLowerCase()}.json`, status: 'INCOMPLETE' as const },
  ])),
};
