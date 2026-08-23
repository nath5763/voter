import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { datasetManifestSchema, jurisdictionDatasetSchema } from '../src/data/schemas';
import type { DatasetManifest } from '../src/types/domain';

async function main() {
  const output = join(process.cwd(), 'public', 'data');
  const manifestText = await readFile(join(output, 'manifest.json'), 'utf8');
  const manifest = datasetManifestSchema.parse(JSON.parse(manifestText)) as DatasetManifest;
  let incomplete = 0;

  for (const [stateCode, entry] of Object.entries(manifest.jurisdictions)) {
    const path = join(process.cwd(), 'public', entry.url.replace(/^\//, ''));
    const text = await readFile(path, 'utf8');
    const hash = createHash('sha256').update(text).digest('hex');
    if (entry.sha256 && entry.sha256 !== hash) throw new Error(`${stateCode}: content hash mismatch`);
    const dataset = jurisdictionDatasetSchema.parse(JSON.parse(text));
    if (dataset.stateCode !== stateCode) throw new Error(`${stateCode}: state code mismatch`);
    if (dataset.status !== 'VERIFIED') incomplete += 1;
  }

  console.log(`Validated ${Object.keys(manifest.jurisdictions).length} jurisdictions; ${incomplete} are explicitly incomplete.`);
  if (process.argv.includes('--require-complete') && incomplete > 0) {
    throw new Error(`Release blocked: ${incomplete} jurisdictions are incomplete.`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
