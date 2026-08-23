import { resolveJurisdiction } from '@/services/jurisdiction-resolver';

describe('nationwide jurisdiction resolution', () => {
  afterEach(() => jest.restoreAllMocks());

  test('rejects a PO box without calling a provider', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const result = await resolveJurisdiction({ street: 'PO Box 42', city: 'Denver', stateCode: 'CO', zipCode: '80202' });
    expect(result.status).toBe('unsupported');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('normalizes Census geographies for a state outside Texas', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          input: { benchmark: { benchmarkName: 'Public Address Ranges' }, vintage: { vintageName: 'Current' } },
          addressMatches: [{
            matchedAddress: '1600 PENNSYLVANIA AVE, SACRAMENTO, CA 95814',
            addressComponents: { city: 'SACRAMENTO', state: 'CA', zip: '95814' },
            geographies: {
              Counties: [{ NAME: 'Sacramento County', GEOID: '06067' }],
              '119th Congressional Districts': [{ BASENAME: '6' }],
              '2024 State Legislative Districts - Upper': [{ BASENAME: '8' }],
              '2024 State Legislative Districts - Lower': [{ BASENAME: '10' }],
            },
          }],
        },
      }),
    } as Response);
    const result = await resolveJurisdiction({ street: '1600 Pennsylvania Ave', city: 'Sacramento', stateCode: 'CA', zipCode: '95814' });
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.jurisdiction.stateName).toBe('California');
      expect(result.jurisdiction.congressionalDistrict).toBe('U.S. House District 6');
      expect(result.jurisdiction.upperLegislativeDistrict).toBe('California Senate 8');
    }
  });
});

