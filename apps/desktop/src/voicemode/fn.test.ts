// fn fn in the window (fn.ts): the thread in view toggles like ctrl+r twice; no thread opens
// bise's own and starts voice there.
import { describe, expect, it } from 'vitest';
import type { VoiceModeState } from '@/store';
import { fnVoiceOf } from './fn';

const vm = (on: boolean, project: string, agent: string) => ({ ev: 'voice_mode', on, project, agent, state: 'listening' }) as unknown as VoiceModeState;

describe('fnVoiceOf', () => {
  it('a thread in view, voice off: on with its agent', () => {
    expect(fnVoiceOf({ screen: 'thread', project: 'shop', agent: 'perf' }, 'home-1', null)).toEqual({ project: 'shop', agent: 'perf', on: true });
    expect(fnVoiceOf({ screen: 'thread', project: 'shop', agent: 'perf' }, 'home-1', vm(false, 'shop', 'perf'))).toEqual({ project: 'shop', agent: 'perf', on: true });
  });

  it('on with that agent: off; on with another agent or project: it moves here', () => {
    const r = { screen: 'thread', project: 'shop', agent: 'perf' } as const;
    expect(fnVoiceOf(r, 'home-1', vm(true, 'shop', 'perf'))).toEqual({ project: 'shop', agent: 'perf', on: false });
    expect(fnVoiceOf(r, 'home-1', vm(true, 'shop', 'docs'))).toEqual({ project: 'shop', agent: 'perf', on: true });
    expect(fnVoiceOf(r, 'home-1', vm(true, 'other', 'perf'))).toEqual({ project: 'shop', agent: 'perf', on: true });
  });

  it("bise's own thread is a thread in view: its main", () => {
    expect(fnVoiceOf({ screen: 'bise' }, 'home-1', null)).toEqual({ project: 'home-1', agent: 'main', on: true });
    expect(fnVoiceOf({ screen: 'bise' }, 'home-1', vm(true, 'home-1', 'main'))).toEqual({ project: 'home-1', agent: 'main', on: false });
  });

  it("no thread in view: bise's own thread opens and voice starts there (never off)", () => {
    for (const r of [{ screen: 'inbox' }, { screen: 'settings' }, { screen: 'artifacts', project: 'shop' }, { screen: 'agents', project: 'shop' }] as const) {
      expect(fnVoiceOf(r, 'home-1', vm(true, 'home-1', 'main'))).toEqual({ go: { screen: 'bise' }, project: 'home-1', agent: 'main', on: true });
    }
  });

  it('no thread and no home known yet: nothing', () => {
    expect(fnVoiceOf({ screen: 'inbox' }, undefined, null)).toBeNull();
    expect(fnVoiceOf({ screen: 'bise' }, undefined, null)).toBeNull();
  });
});
