// A crash report bise writes when its core crashes (designer, voice-window part 2: 'show the
// report' opens it in the window, with copy and show in Finder; it never files anything anywhere).
// ~/.bise/reports/crash-HH-MM.md: how it ended, the versions, and core.log's last lines only
// (amb-core m_16798: heard and said words never go to core.log, and the wire log never goes here).
// reportText is pure; writeReport writes it. Owner: amb-mac.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CoreExit } from '../../shared/api';
import { redactLine } from './exit';

/** At most this many of the log's last lines go in a report. */
export const REPORT_LINES = 60;

export type ReportFacts = {
  readonly reason: string;
  readonly app: string;
  readonly bise: string;
  readonly os: string;
  /** core.log's path */
  readonly log: string;
};

/** The report's file name for a crash at `ms` (local time): crash-HH-MM.md. Pure. */
export function reportName(ms: number): string {
  const d = new Date(ms);
  const two = (n: number): string => String(n).padStart(2, '0');
  return `crash-${two(d.getHours())}-${two(d.getMinutes())}.md`;
}

/** The report: the reason, how it ended, the versions, the log's last lines (each redacted). Pure. */
export function reportText(e: CoreExit, f: ReportFacts, tail: string): string {
  const lines = tail.split(/\r?\n/).filter((l) => l.trim() !== '').slice(-REPORT_LINES).map(redactLine);
  return [
    `# bise crashed: ${f.reason}`,
    '',
    `- when: ${new Date(e.at_ms).toISOString()}`,
    `- how: ${e.how}${e.code === null ? '' : ` ${String(e.code)}`}${e.signal === null ? '' : ` ${e.signal}`}`,
    `- crashes in the last 10 min: ${String(e.crashes ?? 1)}${e.stopped === true ? ' (bise stopped restarting it)' : ''}`,
    `- app: ${f.app}`,
    `- bise: ${f.bise}`,
    `- macOS: ${f.os}`,
    `- log: ${f.log}`,
    '',
    `## the log's last ${String(lines.length)} lines`,
    '',
    '```',
    ...lines,
    '```',
    '',
    'bise never sends this anywhere: it is yours to read or share.',
    '',
  ].join('\n');
}

/** Writes the report in `dir` (made when missing); its path, or null when it can't be written. */
export function writeReport(dir: string, e: CoreExit, f: ReportFacts, tail: string): string | null {
  try {
    mkdirSync(dir, { recursive: true });
    const path = join(dir, reportName(e.at_ms));
    writeFileSync(path, reportText(e, f, tail));
    return path;
  } catch {
    return null;
  }
}
