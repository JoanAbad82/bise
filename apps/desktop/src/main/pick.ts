// window.bise.pickFolder's and pickFiles' test answers (pure; the panel itself is ipc.ts's).
import { isAbsolute } from 'node:path';

/** Test mode's pick: the env's path when absolute, else none (a cancel). */
export function pickedInTest(v: string | undefined): string | null {
  return v !== undefined && v !== '' && isAbsolute(v) ? v : null;
}

/** Test mode's files pick: the env's absolute paths, one per line; anything else is left out. */
export function pickedFilesInTest(v: string | undefined): readonly string[] {
  return (v ?? '').split('\n').map((l) => l.trim()).filter((l) => l !== '' && isAbsolute(l));
}
