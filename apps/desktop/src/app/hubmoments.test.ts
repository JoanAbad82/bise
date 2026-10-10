// The hub's moments the shell acts on (amb-feed m_16785) and bise's /update line.
import { describe, expect, it } from 'vitest';
import { momentOf } from './HubMoments';
import { hubUpdateLine } from './UpdateLine';

const P = 'acme-1a2b3c4d';

describe('the hub moments', () => {
  it('focused moves the open thread of that project to the hub focus, and nothing else', () => {
    const ev = { ev: 'focused', project: P, focus: 'main' } as const;
    expect(momentOf(ev, { screen: 'thread', project: P, agent: 'old' })).toEqual({ go: { screen: 'thread', project: P, agent: 'main' } });
    expect(momentOf(ev, { screen: 'thread', project: P, agent: 'main' }), 'already there').toBeNull();
    expect(momentOf(ev, { screen: 'thread', project: 'shop-1', agent: 'old' }), 'another project').toBeNull();
    expect(momentOf(ev, { screen: 'bise' }), 'another screen').toBeNull();
    // the agent he has open is live: a focused said again (reload, core restart) moves nothing
    expect(momentOf(ev, { screen: 'thread', project: P, agent: 'perf' }, [{ name: 'perf', archived: false }])).toBeNull();
    expect(momentOf(ev, { screen: 'thread', project: P, agent: 'perf' }, [{ name: 'perf', archived: true }]), 'archived: it follows').toEqual({ go: { screen: 'thread', project: P, agent: 'main' } });
  });
  it('card_open opens that card in the inbox block', () => {
    expect(momentOf({ ev: 'card_open', project: P, id: 13 }, { screen: 'bise' })).toEqual({ inbox: { project: P, card: 13 } });
    expect(momentOf({ ev: 'flow', project: P, flow: 'pr' }, { screen: 'bise' })).toBeNull();
  });
});

describe("bise's /update line", () => {
  it('building: the rev and how long; failed: the hub words and the last lines; built or none: nothing', () => {
    expect(hubUpdateLine({ project: P, state: 'building', rev: '1152b33', elapsed: 130 })).toEqual({ text: 'updating bise · 1152b33 · 2 min', tail: [], failed: false });
    expect(hubUpdateLine({ project: P, state: 'building', rev: '1152b33', elapsed: 9 })?.text).toBe('updating bise · 1152b33 · 9 s');
    expect(hubUpdateLine({ project: P, state: 'failed', rev: '1152b33', text: "couldn't build 1152b33, you're still on 9f0e2aa", tail: ['a', 'b', 'c', 'd'] })).toEqual({ text: "▲ couldn't build 1152b33, you're still on 9f0e2aa", tail: ['b', 'c', 'd'], failed: true });
    expect(hubUpdateLine({ project: P, state: 'built', rev: '1152b33' })).toBeNull();
    expect(hubUpdateLine(null)).toBeNull();
  });
});

describe('the crash report head', () => {
  it("names its file with home as '~'", async () => {
    const { reportWhere } = await import('./ReportScreen');
    expect(reportWhere('/Users/g/.bise/reports/crash-14-02.md', '/Users/g')).toBe('~/.bise/reports/crash-14-02.md');
    expect(reportWhere('/tmp/r.md', '/Users/g')).toBe('/tmp/r.md');
    expect(reportWhere('/Users/gx/r.md', '/Users/g')).toBe('/Users/gx/r.md');
  });
});
