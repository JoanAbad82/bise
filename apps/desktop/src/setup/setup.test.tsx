// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Account, AppCmd, Found } from '@/proto';
import { core_ev } from '@/proto/fixtures.gen';
import { fnAct, next, START, stepOf, ticked } from './model';
import { Onboarding, type OnboardingPorts } from './Onboarding';
import { FirstRun, showsFirstRun } from './FirstRun';

afterEach(cleanup);

const NOW = 1791100400000;
const accounts = (): Account[] => {
  const e = core_ev.find((x) => x.ev === 'accounts');
  if (e?.ev !== 'accounts') throw new Error('fixture');
  return e.items;
};
const found = (): Found[] => {
  const e = core_ev.find((x) => x.ev === 'found');
  if (e?.ev !== 'found') throw new Error('fixture');
  return e.items;
};
const ports = (): OnboardingPorts & { sent: AppCmd[]; log: string[] } => {
  const sent: AppCmd[] = [];
  const log: string[] = [];
  return { sent, log, send: (c) => sent.push(c), perm: (p, a) => log.push(`perm ${p} ${a}`), done: () => log.push('done') };
};

describe('the first launch model', () => {
  it('walks hello, permissions, model (only signed in), projects (scans, adds the ticked), fn (onboarded true)', () => {
    const c = { signedIn: false, found: [] as Found[], now: NOW };
    let r = next(START, c);
    r = next(r.s, c);
    expect(stepOf(r.s)).toBe('model');
    expect(next(r.s, c).s).toBe(r.s);
    r = next(r.s, { ...c, signedIn: true });
    expect(stepOf(r.s)).toBe('projects');
    expect(r.cmds).toEqual([{ cmd: 'found_scan' }]);
    r = next(r.s, { ...c, signedIn: true, found: found() });
    expect(r.cmds).toEqual([{ cmd: 'project_add', path: '/Users/camille/code/shop' }]);
    r = next(r.s, c);
    expect(r).toMatchObject({ done: true, cmds: [{ cmd: 'prefs_set', key: 'onboarded', value: true }] });
  });

  it('a recent repo comes ticked, an old one or a known one not; fn counts once he lets go', () => {
    const [shop, acme] = found();
    if (!shop || !acme) throw new Error('fixture');
    expect(ticked(START, shop, NOW)).toBe(true);
    expect(ticked(START, acme, NOW)).toBe(false);
    expect(ticked(START, shop, shop.last_ms + 31 * 86_400_000)).toBe(false);
    const down = fnAct(START, 'talk_start');
    expect([down.fn, down.tried]).toEqual(['down', false]);
    expect(fnAct(down, 'talk_end')).toMatchObject({ fn: 'up', tried: true });
    expect(fnAct(START, 'talk_end').tried).toBe(false);
  });
});

describe('Onboarding', () => {
  it('⏎ walks the steps; permissions ask through the helper; skip writes onboarded and opens bise', () => {
    const p = ports();
    render(<Onboarding accounts={accounts()} found={found()} perms={{ mic: 'ask', accessibility: 'allowed', screen: 'denied' }} ports={p} now={NOW} />);
    expect(screen.getByTestId('setup.step.hello')).toBeTruthy();
    fireEvent.keyDown(screen.getByTestId('setup.root'), { key: 'Enter' });
    fireEvent.click(screen.getByTestId('setup.perm.mic'));
    fireEvent.click(screen.getByTestId('setup.perm.screen.open'));
    expect(screen.queryByTestId('setup.perm.accessibility')).toBeNull();
    expect(p.log).toEqual(['perm mic ask', 'perm screen open']);
    fireEvent.click(screen.getByTestId('setup.next'));
    expect(screen.getByTestId('setup.step.model')).toBeTruthy();
    fireEvent.click(screen.getByTestId('setup.skip'));
    expect(p.sent).toEqual([{ cmd: 'prefs_set', key: 'onboarded', value: true }]);
    expect(p.log.at(-1)).toBe('done');
  });

  it('the model step waits for a sign-in; esc goes a step back', () => {
    const p = ports();
    const out = accounts().map((a) => ({ ...a, state: 'signed_out' as const }));
    const { rerender } = render(<Onboarding accounts={out} found={[]} perms={{}} ports={p} now={NOW} />);
    const root = screen.getByTestId('setup.root');
    fireEvent.keyDown(root, { key: 'Enter' });
    fireEvent.keyDown(root, { key: 'Enter' });
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(screen.getByTestId('setup.step.model')).toBeTruthy();
    rerender(<Onboarding accounts={accounts()} found={[]} perms={{}} ports={p} now={NOW} />);
    fireEvent.keyDown(root, { key: 'Enter' });
    expect(screen.getByTestId('setup.step.projects')).toBeTruthy();
    expect(p.sent).toEqual([{ cmd: 'found_scan' }]);
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(screen.getByTestId('setup.step.model')).toBeTruthy();
  });

  it('the fn step: holding fn then letting go turns its button into open bise', () => {
    const p = ports();
    const props = { accounts: accounts(), found: found(), perms: {}, ports: p, now: NOW };
    const { rerender } = render(<Onboarding {...props} />);
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByTestId('setup.next'));
    expect(screen.getByTestId('setup.step.fn')).toBeTruthy();
    expect(screen.getByTestId('setup.next').textContent).toBe('open bise without trying');
    rerender(<Onboarding {...props} fn={{ act: 'talk_start', n: 1 }} />);
    rerender(<Onboarding {...props} fn={{ act: 'talk_end', n: 2 }} />);
    expect(screen.getByTestId('setup.next').textContent).toBe('open bise');
    fireEvent.click(screen.getByTestId('setup.next'));
    expect(p.sent).toEqual([
      { cmd: 'project_add', path: '/Users/camille/code/shop' },
      { cmd: 'prefs_set', key: 'onboarded', value: true },
    ]);
    expect(p.log).toEqual(['done']);
  });
});

describe('the first-run text (L1 / M18)', () => {
  it("shows the TUI's words; its suggestion hands DEMO to fill, never a send", () => {
    const filled: string[] = [];
    render(<FirstRun onFill={(t) => filled.push(t)} />);
    expect(screen.getByTestId('setup.firstrun').textContent).toContain("what's on your mind?");
    fireEvent.click(screen.getByTestId('setup.firstrun.demo'));
    expect(filled).toEqual(['show me what you can do']);
  });

  it('once the composer holds it, the last line says how to go on', () => {
    render(<FirstRun ready onFill={() => undefined} />);
    expect(screen.getByTestId('setup.firstrun.ready').textContent).toBe('⏎ try it · or just type your own');
    expect(screen.queryByTestId('setup.firstrun.demo')).toBeNull();
  });

  it('shows while he said nothing and main is the only agent', () => {
    expect(showsFirstRun(false, 1)).toBe(true);
    expect(showsFirstRun(true, 1)).toBe(false);
    expect(showsFirstRun(false, 2)).toBe(false);
  });
});
