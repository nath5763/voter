import type { SQLiteDatabase } from 'expo-sqlite';

import { datasetManifestSchema, jurisdictionDatasetSchema } from '@/data/schemas';
import { createSeedDataset } from '@/data/seed';
import type { Candidate, Contest, DatasetManifest, Election, JurisdictionDataset, NotificationRecord, SourceCitation } from '@/types/domain';

interface ElectionRow {
  id: string; state_code: string; name: string; type: Election['type']; election_date: string; time_zone: string;
  jurisdiction: string; status: Election['status']; completeness: Election['completeness']; source_ids_json: string;
}

export async function ensureSeedDataset(db: SQLiteDatabase, stateCode: string) {
  const existing = await db.getFirstAsync<{ state_code: string }>('SELECT state_code FROM dataset_state WHERE state_code = ?', stateCode);
  if (!existing) await installDataset(db, createSeedDataset(stateCode), false);
}

export async function installDataset(db: SQLiteDatabase, candidate: unknown, announce = true): Promise<JurisdictionDataset> {
  const dataset = jurisdictionDatasetSchema.parse(candidate) as JurisdictionDataset;
  const previous = announce ? await loadDataset(db, dataset.stateCode) : null;
  const factChanges = previous ? buildDatasetChangeNotifications(previous, dataset) : [];
  const installedAt = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (tx) => {
    // Phase 1 caches only the active jurisdiction. This also prevents source IDs
    // shared by nationwide providers from colliding across state datasets.
    await tx.runAsync('DELETE FROM election WHERE state_code <> ?', dataset.stateCode);
    await tx.runAsync('DELETE FROM source WHERE state_code <> ?', dataset.stateCode);
    await tx.runAsync('DELETE FROM dataset_state WHERE state_code <> ?', dataset.stateCode);
    await tx.runAsync('DELETE FROM election WHERE state_code = ?', dataset.stateCode);
    await tx.runAsync('DELETE FROM source WHERE state_code = ?', dataset.stateCode);
    await tx.runAsync(
      `INSERT INTO dataset_state(state_code, state_name, schema_version, dataset_version, generated_at, status, installed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(state_code) DO UPDATE SET state_name=excluded.state_name, schema_version=excluded.schema_version,
       dataset_version=excluded.dataset_version, generated_at=excluded.generated_at, status=excluded.status, installed_at=excluded.installed_at`,
      dataset.stateCode, dataset.stateName, dataset.schemaVersion, dataset.datasetVersion, dataset.generatedAt, dataset.status, installedAt,
    );
    for (const source of dataset.sources) {
      await tx.runAsync('INSERT INTO source(id, state_code, payload_json) VALUES (?, ?, ?)', source.id, dataset.stateCode, JSON.stringify(source));
    }
    for (const election of dataset.elections) {
      await tx.runAsync(
        `INSERT INTO election(id, state_code, name, type, election_date, time_zone, jurisdiction, status, completeness, source_ids_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        election.id, election.stateCode, election.name, election.type, election.date, election.timeZone, election.jurisdiction,
        election.status, election.completeness, JSON.stringify(election.sourceIds),
      );
      for (const deadline of election.deadlines) await tx.runAsync('INSERT INTO deadline(id, election_id, payload_json) VALUES (?, ?, ?)', deadline.id, election.id, JSON.stringify(deadline));
      for (const requirement of election.requirements) await tx.runAsync('INSERT INTO requirement(id, election_id, payload_json) VALUES (?, ?, ?)', requirement.id, election.id, JSON.stringify(requirement));
      for (const contest of election.contests) {
        const contestWithoutCandidates = { ...contest, candidates: [] };
        await tx.runAsync('INSERT INTO contest(id, election_id, payload_json) VALUES (?, ?, ?)', contest.id, election.id, JSON.stringify(contestWithoutCandidates));
        for (const person of contest.candidates) await tx.runAsync('INSERT INTO candidate(id, contest_id, payload_json) VALUES (?, ?, ?)', person.id, contest.id, JSON.stringify(person));
      }
    }
    if (announce) {
      const id = `dataset-${dataset.stateCode}-${dataset.datasetVersion}`;
      await tx.runAsync(
        `INSERT OR IGNORE INTO notification_record(id, type, title, message, status, created_at)
         VALUES (?, 'DATASET_UPDATED', ?, ?, ?, ?)`,
        id, `${dataset.stateName} election data updated`, `Dataset ${dataset.datasetVersion} was installed.`, dataset.status, installedAt,
      );
      for (const change of factChanges) {
        await tx.runAsync(
          `INSERT OR IGNORE INTO notification_record(id, type, title, message, election_id, route, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          change.id, change.type, change.title, change.message, change.electionId ?? null, change.route ?? null, change.status, change.createdAt,
        );
      }
    }
  });
  return dataset;
}

export function buildDatasetChangeNotifications(previous: JurisdictionDataset, next: JurisdictionDataset): NotificationRecord[] {
  const priorDeadlines = new Map(previous.elections.flatMap((election) => election.deadlines.map((deadline) => [deadline.id, { deadline, election }] as const)));
  const createdAt = next.generatedAt;
  return next.elections.flatMap((election) => election.deadlines.flatMap((deadline) => {
    const prior = priorDeadlines.get(deadline.id);
    if (!prior || prior.deadline.date === deadline.date) return [];
    return [{
      id: `deadline-change-${deadline.id}-${next.datasetVersion}`,
      type: 'FACT_CHANGED' as const,
      title: `${election.name} deadline changed`,
      message: `${prior.deadline.date} was replaced by ${deadline.date}. Review the official source before acting.`,
      electionId: election.id,
      route: `/deadlines/${deadline.id}`,
      status: 'CHANGED' as const,
      createdAt,
    }];
  }));
}

export async function loadDataset(db: SQLiteDatabase, stateCode: string): Promise<JurisdictionDataset | null> {
  const state = await db.getFirstAsync<{ state_name: string; schema_version: number; dataset_version: string; generated_at: string; status: JurisdictionDataset['status'] }>(
    'SELECT state_name, schema_version, dataset_version, generated_at, status FROM dataset_state WHERE state_code = ?', stateCode,
  );
  if (!state) return null;
  const rows = await db.getAllAsync<ElectionRow>('SELECT * FROM election WHERE state_code = ? ORDER BY election_date', stateCode);
  const elections: Election[] = [];
  for (const row of rows) {
    const deadlines = await db.getAllAsync<{ payload_json: string }>('SELECT payload_json FROM deadline WHERE election_id = ?', row.id);
    const requirements = await db.getAllAsync<{ payload_json: string }>('SELECT payload_json FROM requirement WHERE election_id = ?', row.id);
    const contestRows = await db.getAllAsync<{ id: string; payload_json: string }>('SELECT id, payload_json FROM contest WHERE election_id = ?', row.id);
    const contests: Contest[] = [];
    for (const contestRow of contestRows) {
      const people = await db.getAllAsync<{ payload_json: string }>('SELECT payload_json FROM candidate WHERE contest_id = ?', contestRow.id);
      contests.push({ ...JSON.parse(contestRow.payload_json) as Contest, candidates: people.map((item) => JSON.parse(item.payload_json) as Candidate) });
    }
    elections.push({
      id: row.id, stateCode: row.state_code, name: row.name, type: row.type, date: row.election_date,
      timeZone: row.time_zone, jurisdiction: row.jurisdiction, status: row.status, completeness: row.completeness,
      sourceIds: JSON.parse(row.source_ids_json), deadlines: deadlines.map((item) => JSON.parse(item.payload_json)),
      requirements: requirements.map((item) => JSON.parse(item.payload_json)), contests,
    });
  }
  const sourceRows = await db.getAllAsync<{ payload_json: string }>('SELECT payload_json FROM source WHERE state_code = ?', stateCode);
  return {
    schemaVersion: state.schema_version, datasetVersion: state.dataset_version, generatedAt: state.generated_at,
    stateCode, stateName: state.state_name, status: state.status, elections,
    sources: sourceRows.map((item) => JSON.parse(item.payload_json) as SourceCitation),
  };
}

export async function refreshDataset(db: SQLiteDatabase, stateCode: string): Promise<{ updated: boolean; dataset: JurisdictionDataset }> {
  const baseUrl = process.env.EXPO_PUBLIC_DATA_BASE_URL;
  const cached = await loadDataset(db, stateCode);
  if (!baseUrl) return { updated: false, dataset: cached ?? await installDataset(db, createSeedDataset(stateCode), false) };
  const manifestResponse = await fetch(`${baseUrl.replace(/\/$/, '')}/manifest.json`);
  if (!manifestResponse.ok) throw new Error(`Manifest request failed (${manifestResponse.status})`);
  const manifest = datasetManifestSchema.parse(await manifestResponse.json()) as DatasetManifest;
  const entry = manifest.jurisdictions[stateCode];
  if (!entry) throw new Error(`Dataset does not support ${stateCode}`);
  if (cached?.datasetVersion === entry.version) return { updated: false, dataset: cached };
  const datasetResponse = await fetch(new URL(entry.url, `${baseUrl.replace(/\/$/, '')}/`).toString());
  if (!datasetResponse.ok) throw new Error(`Jurisdiction request failed (${datasetResponse.status})`);
  return { updated: true, dataset: await installDataset(db, await datasetResponse.json()) };
}

export async function listNotifications(db: SQLiteDatabase): Promise<NotificationRecord[]> {
  const rows = await db.getAllAsync<{
    id: string; type: NotificationRecord['type']; title: string; message: string; election_id?: string; route?: string;
    status: NotificationRecord['status']; created_at: string; read_at?: string;
  }>('SELECT * FROM notification_record ORDER BY created_at DESC');
  return rows.map((row) => ({ id: row.id, type: row.type, title: row.title, message: row.message, electionId: row.election_id, route: row.route, status: row.status, createdAt: row.created_at, readAt: row.read_at }));
}

export async function markNotificationRead(db: SQLiteDatabase, id: string) {
  await db.runAsync('UPDATE notification_record SET read_at = COALESCE(read_at, ?) WHERE id = ?', new Date().toISOString(), id);
}

export async function markAllNotificationsRead(db: SQLiteDatabase) {
  await db.runAsync('UPDATE notification_record SET read_at = COALESCE(read_at, ?)', new Date().toISOString());
}

export async function deleteAllLocalData(db: SQLiteDatabase) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.execAsync('DELETE FROM reminder_record; DELETE FROM notification_record; DELETE FROM election; DELETE FROM source; DELETE FROM dataset_state; DELETE FROM app_profile;');
  });
}
