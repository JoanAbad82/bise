import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VoiceModeState } from '@/store';
import { focusedComposer, noteComposerFocus, talkFocusHandlers, talkingTo } from './talking';

const voice = (project: string, agent: string, on: boolean): VoiceModeState => ({ ev: 'voice_mode', project, agent, on, state: 'hearing' });
const ACME = { project: 'acme', agent: 'main' };
const PERF = { project: 'acme', agent: 'perf' };

describe('talkingTo', () => {
  it("a focused composer on a project's main says that project; on another agent, nobody", () => {
    expect(talkingTo(ACME, null)).toBe('acme');
    expect(talkingTo(PERF, null)).toBeNull();
    expect(talkingTo(null, null)).toBeNull();
  });
  it("voice mode on with a main wins over the focus; off or with another agent, the focus decides", () => {
    expect(talkingTo(null, voice('web', 'main', true))).toBe('web');
    expect(talkingTo(ACME, voice('web', 'main', true))).toBe('web');
    expect(talkingTo(ACME, voice('web', 'main', false))).toBe('acme');
    expect(talkingTo(null, voice('web', 'perf', true))).toBeNull();
  });
});

describe('the focused composer', () => {
  afterEach(() => {
    noteComposerFocus(null);
  });
  it("its focus sets it, its blur clears it; a move inside the same composer keeps it; another composer's late blur never clears the new one", () => {
    // node, no DOM: the composer's box knows its mic
    const mic = {} as Element;
    const box = { contains: (n: Element | null) => n === mic } as unknown as Element;
    const acme = talkFocusHandlers(ACME);
    const perf = talkFocusHandlers(PERF);
    acme.onFocus();
    expect(focusedComposer()).toEqual(ACME);
    acme.onBlur({ currentTarget: box, relatedTarget: mic });
    expect(focusedComposer(), 'the field to its mic').toEqual(ACME);
    perf.onFocus();
    acme.onBlur({ currentTarget: box, relatedTarget: null });
    expect(focusedComposer(), "acme's blur after perf's focus").toEqual(PERF);
    perf.onBlur({ currentTarget: box, relatedTarget: null });
    expect(focusedComposer()).toBeNull();
  });
  it('a change tells its readers once; the same addressee again tells nobody', async () => {
    const { subscribeTalking } = await import('./talking');
    const store = { subscribe: vi.fn(() => () => undefined), voiceModeNow: () => null };
    const fn = vi.fn();
    const off = subscribeTalking(store as never, fn);
    noteComposerFocus(ACME);
    noteComposerFocus({ ...ACME });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.subscribe).toHaveBeenCalledWith('voice_mode', fn);
    off();
  });
});
