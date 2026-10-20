// fn's permissions, just in time (desktop-onboarding v4 §3): when the sheet opens, what [allow]
// asks, and the capsule's steps around it.
import { describe, expect, it } from 'vitest';
import { MARK_SHOWN, nextAsk, sheetOpens, shownIn, type Perms } from './perms';
import { START, step } from '@/capsule/machine';

const NONE: Perms = { mic: 'ask', accessibility: 'ask', screen: 'ask' };
const ALL: Perms = { mic: 'allowed', accessibility: 'allowed', screen: 'allowed' };

describe("fn's permissions sheet", () => {
  it('opens on his first fn hold (fn fn, fn space) with one missing; never once shown, never with all granted', () => {
    expect(sheetOpens('talk_start', null, NONE, false)).toBe(true);
    expect(sheetOpens('double', null, { ...ALL, screen: 'denied' }, false)).toBe(true);
    expect(sheetOpens('key', 'space', NONE, false)).toBe(true);
    expect(sheetOpens('talk_start', null, NONE, true)).toBe(false);
    expect(sheetOpens('talk_start', null, ALL, false)).toBe(false);
    // the helper hasn't said yet: nothing is known missing
    expect(sheetOpens('talk_start', null, {}, false)).toBe(false);
    // a release, a tap, another key: never
    expect(sheetOpens('talk_end', null, NONE, false)).toBe(false);
    expect(sheetOpens('key', 'i', NONE, false)).toBe(false);
  });

  it('is marked shown in the hints (hints.fn_perms true), read back from the prefs', () => {
    expect(MARK_SHOWN).toEqual({ cmd: 'prefs_set', key: 'hints.fn_perms', value: true });
    expect(shownIn({ hints: { fn_perms: true } })).toBe(true);
    expect(shownIn({ hints: { first_card: true } })).toBe(false);
    expect(shownIn(null)).toBe(false);
  });

  it('[allow] asks the missing ones in turn: macOS prompt, a refused one its pane, none left: nothing', () => {
    expect(nextAsk(NONE)).toEqual({ perm: 'mic', action: 'ask' });
    expect(nextAsk({ mic: 'allowed', accessibility: 'denied', screen: 'ask' })).toEqual({ perm: 'accessibility', action: 'open' });
    expect(nextAsk({ ...ALL, screen: 'ask' })).toEqual({ perm: 'screen', action: 'ask' });
    expect(nextAsk(ALL)).toBeNull();
  });

  it("the capsule: the sheet at the top with the keys; its fn release talks to nobody; 'not now' opens the spotlight; esc closes", () => {
    const open = step(START, { ev: 'perms_sheet' });
    expect(open.state.view).toEqual({ kind: 'perms' });
    expect(open.fx).toEqual([{ fx: 'show', at: 'top', keys: true }]);
    expect(step(open.state, { ev: 'fn', act: 'talk_end' }).fx).toEqual([]);
    const later = step(open.state, { ev: 'not_now' });
    expect(later.state.view).toEqual({ kind: 'spot' });
    expect(step(open.state, { ev: 'fn', act: 'esc' }).state.view).toEqual({ kind: 'none' });
    expect(step(START, { ev: 'not_now' }).state).toBe(START);
  });
});
