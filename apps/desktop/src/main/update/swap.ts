// The update's swap on disk, write-ahead (architect m_18352): no Electron
// here, so the laws drive it on a temp folder and stop it at each crash
// point (swap.test.ts). The order:
//   1. the record, phase 'staged', naming `<target>.old` (tmp + rename);
//   2. target -> .old;
//   3. the new bundle -> target (on failure: .old back, then the record goes, last);
//   4. the record, phase 'swapped'.
// A crash at any point leaves at least one whole bundle, and the next start
// reads it right (plan.ts startup): no record or another .old is 'stray'.
import { rename, rm, writeFile } from 'node:fs/promises';
import type { SwapRecord } from './plan';

/** Where a swap may stop in a law (a crash right after that step). */
export type SwapStep = 'record' | 'rename_old' | 'rename_new' | 'swapped';

/** The record, all or nothing: a temp file, then one rename. */
export async function writeRecord(file: string, rec: SwapRecord): Promise<void> {
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(rec));
  await rename(tmp, file);
}

/** The swap of `staged` into `target`, keeping the previous one at `<target>.old`; `after`: a law's crash hook. */
export async function swapIn(
  target: string,
  staged: string,
  recFile: string,
  versions: { readonly from: string; readonly to: string },
  after: (step: SwapStep) => void = () => undefined,
): Promise<void> {
  const old = `${target}.old`;
  await rm(old, { recursive: true, force: true });
  const rec: SwapRecord = { phase: 'staged', old_path: old, from_version: versions.from, to_version: versions.to, attempts: 0, ok: false };
  await writeRecord(recFile, rec);
  after('record');
  await rename(target, old);
  after('rename_old');
  try {
    await rename(staged, target);
  } catch (e) {
    await rename(old, target);
    await rm(recFile, { force: true });
    throw e;
  }
  after('rename_new');
  await writeRecord(recFile, { ...rec, phase: 'swapped' });
  after('swapped');
}
