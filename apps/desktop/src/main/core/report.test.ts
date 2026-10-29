import { describe, expect, it } from 'vitest';
import type { CoreExit } from '../../shared/api';
import { REPORT_LINES, reportName, reportText } from './report';

const exit: CoreExit = { how: 'signal', code: null, signal: 'SIGSEGV', crash: true, last: 'boom', log: '/l/core.log', at_ms: Date.UTC(2026, 9, 10, 14, 32), crashes: 3, stopped: true };
const facts = { reason: 'core exited with signal 11', app: 'bise 0.9.0', bise: '/a/bise', os: 'macOS 15.1', log: '/l/core.log' };

describe('the crash report (designer: never filed anywhere)', () => {
  it('is named crash-HH-MM.md in local time', () => {
    const d = new Date(exit.at_ms);
    expect(reportName(exit.at_ms)).toBe(`crash-${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}.md`);
  });
  it('says the reason, how it ended, the crash count, the versions and the log path', () => {
    const t = reportText(exit, facts, 'a\nb\n');
    expect(t).toContain('# bise crashed: core exited with signal 11');
    expect(t).toContain('- how: signal SIGSEGV');
    expect(t).toContain('- crashes in the last 10 min: 3 (bise stopped restarting it)');
    expect(t).toContain('- app: bise 0.9.0');
    expect(t).toContain('- log: /l/core.log');
    expect(t).toContain('bise never sends this anywhere');
  });
  it("holds only the log's last lines, each redacted (never a key)", () => {
    const tail = [...Array.from({ length: 100 }, (_, i) => `line ${String(i)}`), 'api_key=sk-abcdefghijkl'].join('\n');
    const t = reportText(exit, facts, tail);
    expect(t).not.toContain('line 0\n');
    expect(t).toContain(`the log's last ${String(REPORT_LINES)} lines`);
    expect(t).not.toContain('sk-abcdefghijkl');
  });
});
