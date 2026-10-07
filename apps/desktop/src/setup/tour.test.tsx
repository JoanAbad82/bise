// @vitest-environment happy-dom
// The demo's tips (L25 / S37): the TUI's tour.rs walked step by step on fake snapshots.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { isDemo, observe, sent, tip, tipText, TOUR, type Member, type Snap, type Tour } from './tour';
import { Tip } from './Tip';

afterEach(cleanup);

const m = (name: string, number: number | null, archived = false): Member => ({ name, number, archived });
const snap = (members: Member[], focus = 'main', card: string | null = null, palette = false): Snap => ({ members, focus, card, palette });
const text = (t: Tour, s: Snap): string => {
  const k = tip(t, s);
  return k === null ? '' : tipText(k, s).map((p) => (typeof p === 'string' ? p : `{${p.key}}`)).join('');
};

describe('the demo tour', () => {
  it("knows a demo agent by its objective's mark", () => {
    expect(isDemo('  Bise demo: the designer')).toBe(true);
    expect(isDemo('fix the login')).toBe(false);
  });

  it('a window opened during a demo shows no tip', () => {
    let t = observe(TOUR, snap([m('designer', 1)]));
    t = observe(t, snap([m('designer', 1)]));
    expect(tip(t, snap([m('designer', 1)]))).toBeNull();
  });

  it('walks start, inside, card, steer, end, each waiting for its action', () => {
    const team = [m('designer', 1), m('pm', 2)];
    let t = observe(TOUR, snap([]));
    let s = snap(team);
    t = observe(t, s);
    expect(tip(t, s)).toBe('start');
    expect(text(t, s)).toBe('your team just started. they work on their own. {⌥1} looks inside designer. →');
    // he looks inside designer
    s = snap(team, 'designer');
    t = observe(t, s);
    expect(tip(t, s)).toBe('inside');
    expect(text(t, s)).toBe("this is designer's own thread, live. {⌥2} the others · {esc} back to main.");
    // back in main: no tip until a card comes
    s = snap(team);
    t = observe(t, s);
    expect(tip(t, s)).toBeNull();
    s = snap(team, 'main', 'designer');
    t = observe(t, s);
    expect(tip(t, s)).toBe('card');
    expect(text(t, s)).toBe('designer needs you. {⌘I} opens the question, {1} or {2} answers. ↓');
    // answered: the last agent waits for a word
    s = snap(team);
    t = observe(t, s);
    expect(tip(t, s)).toBe('steer');
    expect(text(t, s)).toBe('pm waits for a word from you: {⌥2}, type, {⏎}. ✓ it got it, ✓✓ it read it.');
    // he writes in pm's thread, then leaves it
    s = snap(team, 'pm');
    t = observe(t, s);
    t = sent(t, s);
    s = snap(team);
    t = observe(t, s);
    expect(tip(t, s)).toBeNull();
    // main archives designer: the end
    s = snap([m('designer', null, true), m('pm', 1)]);
    t = observe(t, s);
    expect(tip(t, s)).toBe('end');
    expect(text(t, s)).toBe("that's it. designer is archived: {⌘K} finds it. {⌥1} opens pm.");
    // he opens the agent list: over
    s = snap([m('designer', null, true), m('pm', 1)], 'main', null, true);
    t = observe(t, s);
    expect(tip(t, s)).toBeNull();
    expect(t.on).toBe(false);
  });

  it('a send counts the tip up as done', () => {
    let t = observe(TOUR, snap([]));
    const s = snap([m('designer', 1)]);
    t = observe(t, s);
    expect(tip(t, s)).toBe('start');
    t = sent(t, s);
    expect(tip(t, s)).toBeNull();
  });

  it('the tip draws its keys as keys', () => {
    render(<Tip tip="card" snap={snap([m('designer', 1)], 'main', 'designer')} />);
    const el = screen.getByTestId('setup.tip.card');
    expect(el.textContent).toBe('designer needs you. ⌘I opens the question, 1 or 2 answers. ↓');
    expect([...el.querySelectorAll('.b-kbd')].map((k) => k.textContent)).toEqual(['⌘I', '1', '2']);
  });
});
