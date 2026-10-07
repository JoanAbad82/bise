// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Account, AppCmd, Found } from '@/proto';
import { core_ev } from '@/proto/fixtures.gen';
import { fnAct, next, START, stepOf, ticked } from './model';
import { homePath, Onboarding, type OnboardingPorts } from './Onboarding';
import { FirstRun, showsFirstRun } from './FirstRun';
import { helloOpens, startHereUrl } from './screen';

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

  it('the projects step (round 3): a filter narrows the found list; choose a folder… adds it ticked and it is added on ⏎', async () => {
    const p = ports();
    const picked: string[] = [];
    const pickFolder = () => {
      picked.push('asked');
      return Promise.resolve('/Users/camille/notes');
    };
    // the fixture's shop (recent, ticked) and a second repo not his yet, older (unticked); acme is known: not listed
    const list: Found[] = [...found(), { name: 'billing', path: '/Users/camille/code/billing', git: true, known: false, last_ms: NOW - 90 * 86_400_000 }];
    render(<Onboarding accounts={accounts()} found={list} perms={{}} ports={{ ...p, pickFolder }} now={NOW} />);
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId('setup.next'));
    expect(screen.getByTestId('setup.step.projects')).toBeTruthy();
    // the rows' checks (the rows themselves carry setup.found.<path>)
    const names = () =>
      [...screen.getByTestId('setup.found').querySelectorAll('[data-testid^="setup.found."], [data-testid^="setup.chosen."]')]
        .map((e) => e.getAttribute('data-testid') ?? '')
        .filter((id) => !id.includes('/'));
    expect(names()).toEqual(['setup.found.shop', 'setup.found.billing']);
    fireEvent.change(screen.getByTestId('setup.filter'), { target: { value: 'BILL' } });
    expect(names()).toEqual(['setup.found.billing']);
    fireEvent.change(screen.getByTestId('setup.filter'), { target: { value: 'nothing-like-it' } });
    expect(screen.getByTestId('setup.filter.none').textContent).toContain('no repo matches');
    fireEvent.change(screen.getByTestId('setup.filter'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('setup.choose'));
    await screen.findByTestId('setup.chosen.notes');
    expect(picked).toEqual(['asked']);
    expect(names()).toEqual(['setup.chosen.notes', 'setup.found.shop', 'setup.found.billing']);
    expect(screen.getByTestId('setup.next').textContent).toBe('add 2 projects');
    fireEvent.click(screen.getByTestId('setup.next'));
    expect(p.sent).toEqual([
      { cmd: 'project_add', path: '/Users/camille/notes' },
      { cmd: 'project_add', path: '/Users/camille/code/shop' },
    ]);
  });

  it('paths read with ~ for his home, a long one cut in the middle keeping the last folders', () => {
    expect(homePath('/Users/camille/code/shop', '/Users/camille')).toBe('~/code/shop');
    expect(homePath('/Users/camille', '/Users/camille/')).toBe('~');
    expect(homePath('/opt/src/shop', '/Users/camille')).toBe('/opt/src/shop');
    expect(homePath('/Users/camille/work/clients/acme-industries/platform/storefront', '/Users/camille')).toBe('~/…/acme-industries/platform/storefront');
  });

  it('no picker in the shell: no choose a folder… button', () => {
    render(<Onboarding accounts={accounts()} found={found()} perms={{}} ports={ports()} now={NOW} />);
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByTestId('setup.next'));
    expect(screen.queryByTestId('setup.choose')).toBeNull();
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

describe('the start-here page after hello (S.9)', () => {
  const art = (id: string, kind: string, url: string) => ({ id, kind, title: id, agent: 'main', version: 1, at_ms: NOW, url, new: true });
  it("is the hub's start-here page among the home's artifacts, by its url", () => {
    expect(startHereUrl([art('perf-notes', 'page', 'http://h/p/perf-notes'), art('start-here', 'page', 'http://h/p/start-here')])).toBe('http://h/p/start-here');
    expect(startHereUrl([art('perf-notes', 'page', 'http://h/p/perf-notes')])).toBeNull();
    expect(startHereUrl([art('start-here', 'file', 'http://h/a/start-here')])).toBeNull();
    expect(startHereUrl([art('start-here', 'page', '')])).toBeNull();
  });

  it('opens once, on a fresh home only, after hello however it ended, once its url is known', () => {
    expect(helloOpens(true, false, true, 'http://h/p/start-here')).toBe(true);
    expect(helloOpens(false, false, true, 'http://h/p/start-here')).toBe(false); // onboarded before this window
    expect(helloOpens(true, true, true, 'http://h/p/start-here')).toBe(false); // already opened
    expect(helloOpens(true, false, false, 'http://h/p/start-here')).toBe(false); // hello still up
    expect(helloOpens(true, false, true, null)).toBe(false); // the page not known yet
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
