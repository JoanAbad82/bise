// The floating composer's default addressee per route (page native-mac §6, mockups 6-8).
import { describe, expect, it } from 'vitest';
import { MAIN } from '@/app/route';
import { floatTarget } from './target';

describe('floatTarget', () => {
  it("a project's page writes to its main, an agent's review to that agent", () => {
    expect(floatTarget({ screen: 'agents', project: 'shop' }, 'home-1')).toEqual({ project: 'shop', agent: MAIN });
    expect(floatTarget({ screen: 'changes', project: 'shop' }, 'home-1')).toEqual({ project: 'shop', agent: MAIN });
    expect(floatTarget({ screen: 'artifacts', project: 'shop' }, 'home-1')).toEqual({ project: 'shop', agent: MAIN });
    expect(floatTarget({ screen: 'review', project: 'shop', agent: 'perf' }, 'home-1')).toEqual({ project: 'shop', agent: 'perf' });
  });
  it("a page of no project (inbox, scheduled, plugins, processes, every project's artifacts) writes to bise's main", () => {
    for (const r of [{ screen: 'inbox' }, { screen: 'scheduled' }, { screen: 'plugins' }, { screen: 'running' }, { screen: 'artifacts', project: '' }] as const)
      expect(floatTarget(r, 'home-1')).toEqual({ project: 'home-1', agent: MAIN });
    expect(floatTarget({ screen: 'inbox' }, undefined), 'no home hub yet: none').toBeNull();
  });
  it('none on a thread, bise, an open artifact, settings (its own window), onboarding, the lab or debug', () => {
    expect(floatTarget({ screen: 'thread', project: 'shop', agent: 'perf' }, 'home-1')).toBeNull();
    expect(floatTarget({ screen: 'bise' }, 'home-1')).toBeNull();
    expect(floatTarget({ screen: 'artifacts', project: 'shop', id: 'a1' }, 'home-1')).toBeNull();
    expect(floatTarget({ screen: 'settings' }, 'home-1')).toBeNull();
    expect(floatTarget({ screen: 'onboarding' }, 'home-1')).toBeNull();
    expect(floatTarget({ screen: 'debug', project: 'shop', agent: 'perf' }, 'home-1')).toBeNull();
  });
});
