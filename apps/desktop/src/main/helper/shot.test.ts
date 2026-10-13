// The fn talk's still, with a stub helper and core: never his screen.
import { describe, expect, it } from 'vitest';
import type { HelperCmd, HelperEv } from '../../proto';
import { Shots, shotSwitch, shotWanted } from './shot';

function rig(coreUp = true) {
  const helper: HelperCmd[] = [];
  const core: unknown[] = [];
  const dropped: string[] = [];
  const s = new Shots({
    helper: (c) => helper.push(c),
    core: (c) => {
      core.push(c);
      return coreUp;
    },
    drop: (p) => dropped.push(p),
    dir: '/u/shots',
  });
  const ev = (e: HelperEv) => {
    s.helperEv(e);
  };
  return { s, ev, helper, core, dropped };
}

const PERMS = (screen: 'allowed' | 'denied' | 'ask'): HelperEv => ({ ev: 'perms', accessibility: 'allowed', mic: 'allowed', screen, calendar: 'ask' });
const SHOT: HelperEv = { ev: 'shot', id: 'fn-1', path: '/u/shots/a.png', app: 'Safari', title: 'Stripe pricing' };

describe('the fn talk still', () => {
  it('his switch: off only when context.shot is false', () => {
    expect(shotSwitch(null)).toBe(true);
    expect(shotSwitch({ context: {} })).toBe(true);
    expect(shotSwitch({ context: { shot: true } })).toBe(true);
    expect(shotSwitch({ context: { shot: false } })).toBe(false);
    expect(shotWanted({}, 'allowed')).toBe(true);
    expect(shotWanted({}, 'ask')).toBe(false);
    expect(shotWanted({}, null)).toBe(false);
    expect(shotWanted({ context: { shot: false } }, 'allowed')).toBe(false);
  });

  it('a hold asks the helper once, and its PNG goes to the core with the window name', () => {
    const r = rig();
    r.ev(PERMS('allowed'));
    r.ev({ ev: 'fn', act: 'talk_start' });
    expect(r.helper).toEqual([{ cmd: 'shot', id: 'fn-1', dir: '/u/shots' }]);
    r.ev(SHOT);
    expect(r.core).toEqual([{ cmd: 'shot', path: '/u/shots/a.png', app: 'Safari', title: 'Stripe pricing' }]);
    expect(r.dropped).toEqual([]);
    // the same answer again: no talk waits for it any more
    r.ev(SHOT);
    expect(r.core).toHaveLength(1);
    expect(r.dropped).toEqual(['/u/shots/a.png']);
  });

  it('fn fn (hands-free) asks too; a tap, a key or the end of a talk never does', () => {
    const r = rig();
    r.ev(PERMS('allowed'));
    for (const act of ['tap', 'talk_end', 'key', 'esc', 'cancel'] as const) r.ev({ ev: 'fn', act });
    expect(r.helper).toEqual([]);
    r.ev({ ev: 'fn', act: 'double' });
    expect(r.helper).toEqual([{ cmd: 'shot', id: 'fn-1', dir: '/u/shots' }]);
  });

  it('nothing is asked without Screen Recording or with his switch off: the talk goes without it', () => {
    for (const screen of ['ask', 'denied'] as const) {
      const r = rig();
      r.ev(PERMS(screen));
      r.ev({ ev: 'fn', act: 'talk_start' });
      expect(r.helper).toEqual([]);
    }
    const before = rig();
    before.ev({ ev: 'fn', act: 'talk_start' });
    expect(before.helper, 'no perms heard yet').toEqual([]);
    const off = rig();
    off.ev(PERMS('allowed'));
    off.s.prefsChanged({ context: { shot: false } });
    off.ev({ ev: 'fn', act: 'talk_start' });
    expect(off.helper).toEqual([]);
    off.s.prefsChanged({ context: { shot: true } });
    off.ev({ ev: 'fn', act: 'talk_start' });
    expect(off.helper).toHaveLength(1);
  });

  it('a skipped, empty or failed shot sends nothing; a cancelled talk or a stale one is dropped', () => {
    const r = rig();
    r.ev(PERMS('allowed'));
    r.ev({ ev: 'fn', act: 'talk_start' });
    r.ev({ ev: 'shot', id: 'fn-1', app: '1Password', skipped: true });
    r.ev({ ev: 'fn', act: 'talk_start' });
    r.ev({ ev: 'shot', id: 'fn-2' });
    expect(r.core).toEqual([]);
    expect(r.dropped).toEqual([]);
    r.ev({ ev: 'fn', act: 'talk_start' });
    r.ev({ ev: 'fn', act: 'cancel' });
    r.ev({ ev: 'shot', id: 'fn-3', path: '/u/shots/c.png', app: 'Safari', title: 'x' });
    // an older talk's answer, late: never goes with the newer talk
    r.ev({ ev: 'fn', act: 'talk_start' });
    r.ev({ ev: 'shot', id: 'fn-3', path: '/u/shots/c2.png', app: 'Safari', title: 'x' });
    expect(r.core).toEqual([]);
    expect(r.dropped).toEqual(['/u/shots/c.png', '/u/shots/c2.png']);
    r.ev({ ev: 'shot', id: 'fn-4', path: '/u/shots/d.png', app: 'Safari', title: 'x' });
    expect(r.core).toHaveLength(1);
  });

  it('no core to take it: the PNG is removed', () => {
    const r = rig(false);
    r.ev(PERMS('allowed'));
    r.ev({ ev: 'fn', act: 'talk_start' });
    r.ev(SHOT);
    expect(r.dropped).toEqual(['/u/shots/a.png']);
  });

  it('Screen Recording taken back: the next talk asks nothing', () => {
    const r = rig();
    r.ev(PERMS('allowed'));
    r.ev(PERMS('denied'));
    r.ev({ ev: 'fn', act: 'talk_start' });
    expect(r.helper).toEqual([]);
  });
});
