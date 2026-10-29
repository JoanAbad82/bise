// The nightly invariant check on a real core (fast-try p5): tests/nightly/*.test.ts on tonight's
// recording (scripts/core_record.sh writes tests/nightly/rec/rec.jsonl; CORE_REC another), never
// in `pnpm test`. The recording is read here and handed to the test (inject('rec'); null: none),
// so the test needs no file access. Same alias and setup as the day's.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const rec = process.env['CORE_REC'] ?? resolve(__dirname, 'tests', 'nightly', 'rec', 'rec.jsonl');
const lines: unknown[] | null = existsSync(rec)
  ? readFileSync(rec, 'utf8').split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l) as unknown)
  : null;

export default defineConfig({
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    include: ['tests/nightly/*.test.ts'],
    environment: 'node',
    setupFiles: ['src/test-setup.ts'],
    provide: { rec: lines, recPath: rec },
  },
});
