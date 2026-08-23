import { z } from 'zod';

const status = z.enum(['VERIFIED', 'CHANGED', 'STALE', 'INCOMPLETE', 'CONFLICTING', 'UNAVAILABLE']);
const completeness = z.enum(['COMPLETE', 'INCOMPLETE', 'UNAVAILABLE']);

export const sourceSchema = z.object({
  id: z.string().min(1), providerName: z.string().min(1), url: z.string().url(), retrievedAt: z.string().optional(),
  verifiedAt: z.string().optional(), language: z.enum(['en', 'es']),
  authorityLevel: z.enum(['STATE', 'FEDERAL', 'OFFICIAL_LEGISLATIVE', 'AGGREGATOR']), official: z.boolean(), status: status.optional(),
});

export const jurisdictionDatasetSchema = z.object({
  schemaVersion: z.number().int().positive(), datasetVersion: z.string().min(1), generatedAt: z.string().min(1),
  stateCode: z.string().length(2), stateName: z.string().min(1), status,
  sources: z.array(sourceSchema),
  elections: z.array(z.object({
    id: z.string().min(1), stateCode: z.string().length(2), name: z.string().min(1),
    type: z.enum(['GENERAL', 'PRIMARY', 'PRIMARY_RUNOFF', 'RUNOFF', 'SPECIAL']), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timeZone: z.string().min(1), jurisdiction: z.string().min(1), status, completeness,
    sourceIds: z.array(z.string()),
    deadlines: z.array(z.object({
      id: z.string(), type: z.enum(['REGISTRATION', 'EARLY_START', 'EARLY_END', 'MAIL_REQUEST', 'MAIL_RETURN', 'ELECTION_DAY']),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().optional(), timeZone: z.string().optional(),
      qualifier: z.enum(['RECEIVED_OR_POSTMARKED', 'RECEIVED_BY', 'POSTMARKED_BY', 'IN_PERSON_BY', 'DATE_ONLY']).optional(),
      status, sourceIds: z.array(z.string()), previousDate: z.string().optional(),
    })),
    requirements: z.array(z.object({
      id: z.string(), type: z.enum(['REGISTRATION', 'VOTER_ID', 'EARLY_VOTING', 'MAIL_VOTING']), title: z.string(), summary: z.string(), status, sourceIds: z.array(z.string()),
    })),
    contests: z.array(z.object({
      id: z.string(), office: z.string(), level: z.enum(['FEDERAL', 'STATE', 'DC_WIDE']), district: z.string().optional(),
      orderStatus: z.enum(['OFFICIAL', 'ALPHABETICAL_FALLBACK', 'UNAVAILABLE']), completeness,
      sourceIds: z.array(z.string()), candidates: z.array(z.object({
        id: z.string(), name: z.string(), party: z.string().optional(), incumbent: z.boolean().optional(), ballotOrder: z.number().int().positive().optional(),
        ballotStatus: z.enum(['ACTIVE', 'WITHDRAWN', 'DISQUALIFIED']).optional(), campaignUrl: z.string().url().optional(), sourceIds: z.array(z.string()),
      })),
    })),
  })),
});

export const datasetManifestSchema = z.object({
  schemaVersion: z.number().int().positive(), datasetVersion: z.string().min(1), generatedAt: z.string().min(1),
  federal: z.object({ version: z.string(), url: z.string(), sha256: z.string().optional(), status }),
  jurisdictions: z.record(z.string(), z.object({ version: z.string(), url: z.string(), sha256: z.string().optional(), status })),
});

