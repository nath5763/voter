import { jurisdictionDatasetSchema } from '@/data/schemas';
import { createSeedDataset } from '@/data/seed';
import { US_JURISDICTIONS } from '@/data/states';
import { buildDatasetChangeNotifications } from '@/services/election-repository';

describe('nationwide Phase 1 data contracts', () => {
  test('covers all 50 states and Washington, DC exactly once', () => {
    expect(US_JURISDICTIONS).toHaveLength(51);
    expect(new Set(US_JURISDICTIONS.map((item) => item.code)).size).toBe(51);
    expect(US_JURISDICTIONS.some((item) => item.code === 'DC')).toBe(true);
  });

  test.each(US_JURISDICTIONS.map((item) => item.code))('%s seed is schema-valid and explicitly incomplete', (stateCode) => {
    const dataset = jurisdictionDatasetSchema.parse(createSeedDataset(stateCode));
    expect(dataset.stateCode).toBe(stateCode);
    expect(dataset.status).toBe('INCOMPLETE');
    expect(dataset.elections[0].date).toBe('2026-11-03');
    expect(dataset.elections[0].contests).toEqual([]);
  });

  test('creates a deadline-level change record and deep link', () => {
    const previous = createSeedDataset('CA');
    const next = createSeedDataset('CA');
    next.datasetVersion = 'phase1-seed-2';
    next.elections[0].deadlines[0].date = '2026-11-04';
    const changes = buildDatasetChangeNotifications(previous, next);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ status: 'CHANGED', route: `/deadlines/${next.elections[0].deadlines[0].id}` });
    expect(changes[0].message).toContain('2026-11-03');
    expect(changes[0].message).toContain('2026-11-04');
  });
});
