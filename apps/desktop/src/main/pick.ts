// window.bise.pickFolder's test answer (pure; the panel itself is ipc.ts's).
import { isAbsolute } from 'node:path';

/** Test mode's pick: the env's path when absolute, else none (a cancel). */
export function pickedInTest(v: string | undefined): string | null {
  return v !== undefined && v !== '' && isAbsolute(v) ? v : null;
}
