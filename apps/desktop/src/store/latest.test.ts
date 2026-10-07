import { describe, expect, it } from 'vitest';
import { core_ev, hub_ev } from '@/proto/fixtures.gen';
import type { CorePort, CoreState } from '@/shared/api';
import { Latest } from '@/shared/latest';
import { connect } from './hooks';
import { Store } from './store';

describe('Latest', () => {
  it('keeps the newest state event per tag and project, never live-only ones', () => {
    const l = new Latest();
    l.keep({ ev: 'projects', projects: [1] });
    l.keep({ ev: 'agents', project: 'a', agents: [1] });
    l.keep({ ev: 'agents', project: 'b', agents: [2] });
    l.keep({ ev: 'entry', project: 'a', agent: 'x', entry: {} });
    l.keep({ ev: 'typing', project: 'a', agent: 'x', text: 'y' });
    l.keep({ ev: 'job_end', project: 'a' });
    l.keep({ ev: 'projects', projects: [2] });
    expect(l.snapshot()).toEqual([
      { ev: 'agents', project: 'a', agents: [1] },
      { ev: 'agents', project: 'b', agents: [2] },
      { ev: 'projects', projects: [2] },
    ]);
    l.clear();
    expect(l.snapshot()).toEqual([]);
  });

  it('a window that loads late gets the state the earlier events made (amb-tools m_9703)', async () => {
    // main saw every fixture event before this window existed
    const l = new Latest();
    for (const ev of [...core_ev, ...hub_ev]) l.keep({ ...ev });
    const port: CorePort = {
      send: () => undefined,
      onEvent: () => () => undefined,
      onState: () => () => undefined,
      state: () => Promise.resolve<CoreState>('up'),
      snapshot: () => Promise.resolve(l.snapshot()),
    };
    const late = new Store(port);
    connect(late, port);
    await Promise.resolve();
    await Promise.resolve();
    const early = new Store(null);
    for (const ev of [...core_ev, ...hub_ev]) early.apply(ev);
    expect(late.projects()).toEqual(early.projects());
    expect(late.prefs()).toEqual(early.prefs());
    expect(late.accounts()).toEqual(early.accounts());
    const p = early.projects()[0]?.project ?? '';
    expect(late.cards(p)).toEqual(early.cards(p));
    expect(late.agents('acme-1a2b3c4d')).toEqual(early.agents('acme-1a2b3c4d'));
    expect(late.jobs('acme-1a2b3c4d')).toEqual(early.jobs('acme-1a2b3c4d'));
    expect(late.core()).toBe('up');
  });

  it("keeps a hub's refusal for a late window until that hub welcomes the core again", () => {
    const l = new Latest();
    l.keep({ ev: 'hub_refused', project: 'shop', error: 'an agent process' });
    l.keep({ ev: 'hub_refused', project: 'mail', error: 'an agent process' });
    expect(l.snapshot().filter((e) => e['ev'] === 'hub_refused').map((e) => e['project'])).toEqual(['shop', 'mail']);
    l.keep({ ev: 'welcome', project: 'shop', proto: 1, workspace: '/p/shop', name: 'shop' });
    expect(l.snapshot().filter((e) => e['ev'] === 'hub_refused').map((e) => e['project'])).toEqual(['mail']);
    const s = new Store(null);
    for (const ev of l.snapshot()) s.apply(ev);
    expect([s.hubRefused('mail'), s.hubRefused('shop')]).toEqual(['an agent process', null]);
  });
});
