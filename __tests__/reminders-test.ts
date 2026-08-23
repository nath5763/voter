import { createSeedDataset } from '@/data/seed';
import { buildDesiredReminders } from '@/services/reminders';

describe('local reminder policy', () => {
  test('builds reminders only for verified or changed facts', () => {
    const dataset = createSeedDataset('NY');
    const election = dataset.elections[0];
    election.deadlines.push({
      id: 'conflict', type: 'REGISTRATION', date: '2026-10-09', qualifier: 'DATE_ONLY', status: 'CONFLICTING', sourceIds: ['eac-national'],
    });
    const reminders = buildDesiredReminders([election], 'en-US', dataset.datasetVersion);
    expect(reminders.every((item) => item.deadlineId !== 'conflict')).toBe(true);
    expect(reminders.every((item) => item.electionId === election.id)).toBe(true);
  });
});

