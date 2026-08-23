import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export type AsyncQueue = <T>(operation: () => Promise<T>) => Promise<T>;

export function createAsyncQueue(): AsyncQueue {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(operation: () => Promise<T>) => {
    const result = tail.catch(() => undefined).then(operation);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };
}

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) >= DATABASE_VERSION) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      profile_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS dataset_state (
      state_code TEXT PRIMARY KEY,
      state_name TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      dataset_version TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      status TEXT NOT NULL,
      installed_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS source (
      id TEXT PRIMARY KEY,
      state_code TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS election (
      id TEXT PRIMARY KEY,
      state_code TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      election_date TEXT NOT NULL,
      time_zone TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      status TEXT NOT NULL,
      completeness TEXT NOT NULL,
      source_ids_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS deadline (
      id TEXT PRIMARY KEY,
      election_id TEXT NOT NULL REFERENCES election(id) ON DELETE CASCADE,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS requirement (
      id TEXT PRIMARY KEY,
      election_id TEXT NOT NULL REFERENCES election(id) ON DELETE CASCADE,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contest (
      id TEXT PRIMARY KEY,
      election_id TEXT NOT NULL REFERENCES election(id) ON DELETE CASCADE,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS candidate (
      id TEXT PRIMARY KEY,
      contest_id TEXT NOT NULL REFERENCES contest(id) ON DELETE CASCADE,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notification_record (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      election_id TEXT,
      route TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
    CREATE TABLE IF NOT EXISTS reminder_record (
      id TEXT PRIMARY KEY,
      expo_identifier TEXT NOT NULL,
      election_id TEXT NOT NULL,
      deadline_id TEXT NOT NULL,
      dataset_version TEXT NOT NULL,
      trigger_at TEXT NOT NULL,
      locale TEXT NOT NULL,
      category TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS election_state_date ON election(state_code, election_date);
    CREATE INDEX IF NOT EXISTS notification_created ON notification_record(created_at DESC);
    CREATE INDEX IF NOT EXISTS reminder_election ON reminder_record(election_id);
  `);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
