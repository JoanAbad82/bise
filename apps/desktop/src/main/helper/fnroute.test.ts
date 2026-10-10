import { describe, expect, it } from 'vitest';
import type { HelperEv } from '../../proto';
import { fnToWindow } from './fnroute';

const fn = (act: string, key?: string): HelperEv => ({ ev: 'fn', act, ...(key === undefined ? {} : { key }) }) as unknown as HelperEv;

describe('fnToWindow (fn fn with bise in front is voice mode in the window: lead m_16973)', () => {
  it('fn fn with the window in front goes to the window', () => {
    expect(fnToWindow(fn('double'), true)).toBe(true);
  });
  it('fn fn anywhere else keeps the capsule talk', () => {
    expect(fnToWindow(fn('double'), false)).toBe(false);
  });
  it('a hold, a tap, the end of a talk or fn space always stay with the capsule', () => {
    for (const e of [fn('talk_start'), fn('talk_end'), fn('tap'), fn('cancel'), fn('key', 'space')]) expect(fnToWindow(e, true)).toBe(false);
  });
  it('other helper events never', () => {
    expect(fnToWindow({ ev: 'hello' } as unknown as HelperEv, true)).toBe(false);
  });
});
