import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { jurisdictionDatasetSchema } from '../src/data/schemas';
import { createSeedDataset, SEED_VERSION } from '../src/data/seed';
import { US_JURISDICTIONS } from '../src/data/states';
import type { DatasetManifest } from '../src/types/domain';

const root = process.cwd();
const output = join(root, 'public', 'data');
const statesOutput = join(output, 'states');

function serialize(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

async function main() {
  await mkdir(statesOutput, { recursive: true });
  const jurisdictions: DatasetManifest['jurisdictions'] = {};
  const coverage: { stateCode: string; stateName: string; status: string; requiredAdapter: string }[] = [];

  for (const state of US_JURISDICTIONS) {
    const dataset = jurisdictionDatasetSchema.parse(createSeedDataset(state.code));
    const body = serialize(dataset);
    await writeFile(join(statesOutput, `${state.code.toLowerCase()}.json`), body, 'utf8');
    jurisdictions[state.code] = {
      version: dataset.datasetVersion,
      url: `/data/states/${state.code.toLowerCase()}.json`,
      sha256: sha256(body),
      status: dataset.status,
    };
    coverage.push({ stateCode: state.code, stateName: state.name, status: dataset.status, requiredAdapter: 'Official state/DC election authority' });
  }

  const federal = serialize({
  schemaVersion: 1,
  datasetVersion: SEED_VERSION,
  generatedAt: '2026-08-23T00:00:00Z',
  status: 'INCOMPLETE',
  elections: [{ id: 'federal-general-2026', name: '2026 Federal General Election', date: '2026-11-03', status: 'VERIFIED' }],
  sources: [{ providerName: 'U.S. Election Assistance Commission', url: 'https://www.eac.gov/voters/register-and-vote-in-your-state' }],
  });
  await writeFile(join(output, 'federal.json'), federal, 'utf8');

  const manifest: DatasetManifest = {
  schemaVersion: 1,
  datasetVersion: SEED_VERSION,
  generatedAt: '2026-08-23T00:00:00Z',
  federal: { version: SEED_VERSION, url: '/data/federal.json', sha256: sha256(federal), status: 'INCOMPLETE' },
  jurisdictions,
  };
  await writeFile(join(output, 'manifest.json'), serialize(manifest), 'utf8');
  await writeFile(join(output, 'coverage.json'), serialize({ datasetVersion: SEED_VERSION, jurisdictions: coverage }), 'utf8');

  console.log(`Generated ${coverage.length} jurisdiction datasets in ${output}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
