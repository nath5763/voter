import type { Election, SourceCitation } from '@/types/domain';

export const sources: SourceCitation[] = [
  {
    id: 'vote-texas',
    providerName: 'Texas Secretary of State — VoteTexas.gov',
    url: 'https://www.votetexas.gov/',
    verifiedAt: '2026-08-19T18:00:00-05:00',
    language: 'en',
    official: true,
  },
  {
    id: 'sample-filing',
    providerName: 'Synthetic candidate fixture — not an official filing',
    url: 'https://www.sos.texas.gov/elections/candidates/index.shtml',
    verifiedAt: '2026-08-19T18:00:00-05:00',
    language: 'en',
    official: false,
  },
];

export const elections: Election[] = [
  {
    id: 'tx-general-2026',
    name: 'Texas General Election',
    type: 'GENERAL',
    date: '2026-11-03',
    jurisdiction: 'Texas · sample federal and state districts',
    status: 'VERIFIED',
    sourceIds: ['vote-texas', 'sample-filing'],
    deadlines: [
      { id: 'registration', type: 'REGISTRATION', date: '2026-10-05', qualifier: 'RECEIVED_OR_POSTMARKED', status: 'VERIFIED', sourceId: 'vote-texas' },
      { id: 'early-start', type: 'EARLY_START', date: '2026-10-19', qualifier: 'DATE_ONLY', status: 'VERIFIED', sourceId: 'vote-texas' },
      { id: 'mail-request', type: 'MAIL_REQUEST', date: '2026-10-23', qualifier: 'RECEIVED_BY', status: 'VERIFIED', sourceId: 'vote-texas' },
      { id: 'early-end', type: 'EARLY_END', date: '2026-10-30', qualifier: 'DATE_ONLY', status: 'VERIFIED', sourceId: 'vote-texas' },
      { id: 'election-day', type: 'ELECTION_DAY', date: '2026-11-03', qualifier: 'DATE_ONLY', status: 'VERIFIED', sourceId: 'vote-texas' },
    ],
    contests: [
      {
        id: 'sample-us-house',
        office: 'U.S. Representative',
        level: 'FEDERAL',
        district: 'Sample Congressional District 7',
        orderStatus: 'SAMPLE',
        candidates: [
          { id: 'alex-rivera', name: 'Alex Rivera', party: 'Sample Party A', incumbent: false, ballotOrder: 1, sourceId: 'sample-filing' },
          { id: 'jordan-lee', name: 'Jordan Lee', party: 'Sample Party B', incumbent: true, ballotOrder: 2, sourceId: 'sample-filing' },
        ],
      },
      {
        id: 'sample-state-house',
        office: 'Texas State Representative',
        level: 'STATE',
        district: 'Sample State House District 134',
        orderStatus: 'SAMPLE',
        candidates: [
          { id: 'morgan-chen', name: 'Morgan Chen', party: 'Sample Party B', incumbent: false, ballotOrder: 1, sourceId: 'sample-filing' },
          { id: 'taylor-brooks', name: 'Taylor Brooks', party: 'Sample Party A', incumbent: false, ballotOrder: 2, sourceId: 'sample-filing' },
        ],
      },
    ],
  },
];

export const nextElection = elections[0];
export const getElection = (id: string) => elections.find((election) => election.id === id);
export const getSource = (id: string) => sources.find((source) => source.id === id);

export function getCandidate(id: string) {
  for (const election of elections) {
    for (const contest of election.contests) {
      const candidate = contest.candidates.find((item) => item.id === id);
      if (candidate) return { candidate, contest, election };
    }
  }
  return undefined;
}
