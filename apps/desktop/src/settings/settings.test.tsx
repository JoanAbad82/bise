// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Account, AppCmd, Found, Model, ProjectRow, RoleRow } from '@/proto';
import type { CoreCmd } from '@/shared/api';
import { heldReady, modelOrSetup, needsSetup, releaseHeld, type Held } from './hold';
import { core_ev } from '@/proto/fixtures.gen';
import { Settings, type SettingsPorts } from './Settings';
import { appName, excludedApps, flag, getPref, knownApps, onboarded, putPref, type Prefs } from './prefs';
import { addPaths, offers, ordered } from './projects';
import { KEY_SECTIONS } from './keys';
import { checks } from './check';

afterEach(cleanup);

const ev = <T extends (typeof core_ev)[number]['ev']>(t: T) => {
  const e = core_ev.find((x) => x.ev === t);
  if (e?.ev !== t) throw new Error(`no ${t} fixture`);
  return e as Extract<(typeof core_ev)[number], { ev: T }>;
};
const prefs = (): Prefs => {
  const p = ev('prefs').prefs;
  if (p === null || typeof p !== 'object' || Array.isArray(p)) throw new Error('prefs');
  return { ...p, app_names: { 'com.apple.MobileSMS': 'Messages', 'com.bitwarden.desktop': 'Bitwarden' } };
};
const accounts = (): Account[] => ev('accounts').items;
const projects = (): ProjectRow[] => ev('projects').projects;
const found = (): Found[] => ev('found').items;

const ports = (): SettingsPorts & { sent: AppCmd[]; went: string[] } => {
  const sent: AppCmd[] = [];
  const went: string[] = [];
  return { sent, went, send: (c) => sent.push(c), back: () => went.push('back'), go: (p) => went.push(p) };
};

const view = (page: string, p = ports(), extra: Partial<Parameters<typeof Settings>[0]> = {}) =>
  render(<Settings page={page} prefs={prefs()} accounts={accounts()} projects={projects()} found={found()} plugins={null} computerUse={null} perms={{}} ports={p} {...extra} />);

describe('prefs', () => {
  it('reads and puts dotted keys without touching the rest', () => {
    const p = prefs();
    expect(getPref(p, 'quiet.batch_min')).toBe(20);
    expect(getPref(p, 'nope.x')).toBeUndefined();
    const q = putPref(p, 'quiet.call', false);
    expect(getPref(q, 'quiet.call')).toBe(false);
    expect(getPref(q, 'quiet.batch_min')).toBe(20);
    expect(getPref(p, 'quiet.call')).toBe(true);
    expect(flag(null, 'context.shot')).toBe(true);
    expect(onboarded(null)).toBe(false);
    expect(onboarded(p)).toBe(true);
  });

  it("names the apps from the core's table, else the id's last part", () => {
    const p = prefs();
    expect(appName(p, 'com.apple.MobileSMS')).toBe('Messages');
    expect(appName(p, 'com.example.Notes')).toBe('Notes');
    expect(excludedApps(p)).toEqual(['1Password']);
    expect(knownApps(p)).toEqual(['com.apple.MobileSMS', 'com.bitwarden.desktop', '1Password']);
  });
});

describe('projects', () => {
  it('orders his projects without bise, offers found repos not his yet, adds the typed path once', () => {
    expect(ordered(projects()).map((p) => p.name)).toEqual(['acme']);
    expect(offers(found(), projects()).map((f) => f.name)).toEqual(['shop']);
    expect(addPaths(['/a'], ' /b ')).toEqual(['/a', '/b']);
    expect(addPaths(['/a'], '/a')).toEqual(['/a']);
  });
});

describe('Settings', () => {
  it('a switch sends prefs_set and flips at once', () => {
    const p = ports();
    view('quiet', p);
    const t = screen.getByTestId('settings.pref.quiet.call');
    expect(t.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(t);
    expect(p.sent).toEqual([{ cmd: 'prefs_set', key: 'quiet.call', value: false }]);
    expect(screen.getByTestId('settings.pref.quiet.call').getAttribute('aria-checked')).toBe('false');
  });

  it('the nav goes to a page; esc goes back; an unknown page is general', () => {
    const p = ports();
    view('nope', p);
    expect(screen.getByTestId('settings.page.general')).toBeTruthy();
    fireEvent.click(screen.getByTestId('settings.nav.keys'));
    fireEvent.keyDown(screen.getByTestId('settings.root'), { key: 'Escape' });
    expect(p.went).toEqual(['keys', 'back']);
  });

  it('privacy: an excluded app toggles in the list of ids', () => {
    const p = ports();
    view('privacy', p);
    fireEvent.click(screen.getByTestId('settings.app.com.apple.MobileSMS'));
    expect(p.sent).toEqual([{ cmd: 'prefs_set', key: 'excluded_apps', value: ['1Password', 'com.apple.MobileSMS'] }]);
  });

  it('models: sign in on his click only, a key is sent once and never shown', () => {
    const p = ports();
    view('models', p);
    expect(screen.getByTestId('settings.account.chatgpt.ok')).toBeTruthy();
    expect(p.sent).toEqual([]);
    fireEvent.click(screen.getByTestId('settings.key.add'));
    const f = screen.getByTestId<HTMLInputElement>('settings.key.field');
    expect(f.type).toBe('password');
    f.value = 'sk-test';
    fireEvent.keyDown(f, { key: 'Enter' });
    expect(p.sent).toEqual([{ cmd: 'key_set', id: 'anthropic-key', key: 'sk-test' }]);
    // the field stays while the core checks, and a second ⏎ sends nothing more
    expect(screen.getByTestId('settings.key.help').textContent).toMatch(/checking/);
    fireEvent.keyDown(f, { key: 'Enter' });
    expect(p.sent.length).toBe(1);
  });

  it('S.2: a key the core refuses says so in place, the field kept; the key added closes it', () => {
    const p = ports();
    const r = view('models', p);
    fireEvent.click(screen.getByTestId('settings.key.add'));
    const f = screen.getByTestId<HTMLInputElement>('settings.key.field');
    f.value = 'sk-wrong';
    fireEvent.keyDown(f, { key: 'Enter' });
    const again = (extra: Partial<Parameters<typeof Settings>[0]>) => {
      r.rerender(<Settings page="models" prefs={prefs()} accounts={extra.accounts ?? accounts()} projects={projects()} found={found()} plugins={null} computerUse={null} perms={{}} ports={p} {...extra} />);
    };
    again({ keyError: { n: 1, text: 'anthropic-key: the provider refused this key (401)' } });
    const help = screen.getByTestId('settings.key.help');
    expect(help.textContent).toBe('the provider refused this key (401). check it, then ⏎ again');
    expect(help.getAttribute('role')).toBe('alert');
    expect(screen.getByTestId<HTMLInputElement>('settings.key.field').value).toBe('sk-wrong');
    expect(document.body.textContent).not.toContain('sk-wrong');
    // he fixes it and sends again: one more key_set
    const g = screen.getByTestId<HTMLInputElement>('settings.key.field');
    fireEvent.change(g, { target: { value: 'sk-right' } });
    fireEvent.keyDown(g, { key: 'Enter' });
    expect(p.sent.filter((c) => c.cmd === 'key_set').length).toBe(2);
    expect(screen.getByTestId('settings.key.help').textContent).toMatch(/checking/);
    // the core adds it: the field goes, the row says added
    again({ keyError: { n: 1, text: 'anthropic-key: the provider refused this key (401)' }, accounts: accounts().map((a) => (a.id === 'anthropic-key' ? { ...a, state: 'signed_in' } : a)) });
    expect(screen.queryByTestId('settings.key.field')).toBeNull();
  });

  it('a subscription signed out signs in on click, with a spinner until the core answers', () => {
    const p = ports();
    const signedOut = accounts().map((a) => ({ ...a, state: 'signed_out' as const }));
    view('models', p, { accounts: signedOut });
    fireEvent.click(screen.getByTestId('settings.account.chatgpt'));
    expect(p.sent).toEqual([{ cmd: 'sign_in', id: 'chatgpt' }]);
    expect(screen.getByTestId('settings.account.chatgpt').getAttribute('aria-busy')).toBe('true');
  });

  it('projects: remove asks once; rename; add a found repo with land', () => {
    const p = ports();
    view('projects', p);
    fireEvent.click(screen.getByTestId('settings.project.acme-1a2b3c4d.remove'));
    expect(p.sent).toEqual([]);
    fireEvent.click(screen.getByTestId('settings.project.acme-1a2b3c4d.remove.yes'));
    fireEvent.click(screen.getByTestId('settings.project.acme-1a2b3c4d.rename'));
    const n = screen.getByTestId<HTMLInputElement>('settings.project.acme-1a2b3c4d.name');
    n.value = 'engine';
    fireEvent.keyDown(n, { key: 'Enter' });
    fireEvent.click(screen.getByTestId('settings.project.add'));
    fireEvent.click(screen.getByTestId('settings.add.found.shop'));
    fireEvent.click(screen.getByTestId('settings.add.land'));
    fireEvent.click(screen.getByTestId('settings.add.go'));
    expect(p.sent).toEqual([
      { cmd: 'project_remove', project: 'acme-1a2b3c4d' },
      { cmd: 'project_rename', project: 'acme-1a2b3c4d', name: 'engine' },
      { cmd: 'project_add', path: '/Users/camille/code/shop', land: true },
    ]);
  });

  it('keys: every row of the table shows, no key twice in a section', () => {
    view('keys');
    for (const s of KEY_SECTIONS) {
      const g = screen.getByTestId(`settings.keys.${s.id}`);
      for (const r of s.rows) expect(g.textContent).toContain(r.action);
      expect(new Set(s.rows.map((r) => r.keys)).size).toBe(s.rows.length);
    }
  });
});

describe('plugins', () => {
  const plugins = () => {
    const e = core_ev.find((x) => x.ev === 'plugins' && x.project == null);
    if (e?.ev !== 'plugins') throw new Error('fixture');
    return e.items;
  };

  it('asks the core when the page opens; toggles, logs in on click only, logs out', () => {
    const p = ports();
    view('plugins', p, { plugins: plugins() });
    expect(p.sent).toEqual([{ cmd: 'plugins' }]);
    expect(screen.getByTestId('settings.plugin.linear').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByTestId('settings.plugin.computer').getAttribute('aria-checked')).toBe('false');
    fireEvent.click(screen.getByTestId('settings.plugin.computer'));
    fireEvent.click(screen.getByTestId('settings.login.linear'));
    fireEvent.click(screen.getByTestId('settings.login.notes.out'));
    expect(p.sent.slice(1)).toEqual([
      { cmd: 'plugin_set', name: 'computer', on: true },
      { cmd: 'plugin_login', name: 'linear' },
      { cmd: 'plugin_logout', name: 'notes' },
    ]);
    expect(screen.getByTestId('settings.plugins.logins').textContent).toContain('notes.example.com · logged in · 4 tools');
  });

  it('none yet: says it looks; a login running shows its spinner', () => {
    view('plugins', ports(), { plugins: null });
    expect(screen.getByTestId('settings.page.plugins').textContent).toContain('looking at your plugins');
    cleanup();
    const pending = plugins().map((x) => ({ ...x, logins: (x.logins ?? []).map((l) => ({ ...l, state: 'pending' })) }));
    view('plugins', ports(), { plugins: pending });
    expect(screen.getByTestId('settings.login.linear').getAttribute('aria-busy')).toBe('true');
  });
});

describe('computer use', () => {
  const cu = () => {
    const e = core_ev.find((x) => x.ev === 'computer_use' && x.on);
    if (e?.ev !== 'computer_use') throw new Error('fixture');
    return e;
  };

  it('checks while open, leaves when closed; a fix only on his click; on and off', () => {
    const p = ports();
    const { unmount } = view('computer', p, { computerUse: cu() });
    expect(p.sent).toEqual([{ cmd: 'computer_use', act: 'check' }]);
    expect(screen.getByTestId('settings.cu.web').textContent).toContain('add bise to Chrome');
    expect(screen.getByTestId('settings.cu.apps').textContent).toContain('accessibility');
    expect(screen.queryByTestId('settings.cu.browser')).toBeNull();
    fireEvent.click(screen.getByTestId('settings.cu.extension'));
    fireEvent.click(screen.getByTestId('settings.cu.switch'));
    unmount();
    expect(p.sent.slice(1)).toEqual([
      { cmd: 'computer_use', act: 'fix', fix: 'add_extension' },
      { cmd: 'computer_use', act: 'off' },
      { cmd: 'computer_use', act: 'leave' },
    ]);
  });

  it('off: no steps, the switch turns it on', () => {
    const p = ports();
    view('computer', p, { computerUse: { ev: 'computer_use', on: false, ready: false, rows: [] } });
    expect(screen.queryByTestId('settings.cu.web')).toBeNull();
    fireEvent.click(screen.getByTestId('settings.cu.switch'));
    expect(p.sent.at(-1)).toEqual({ cmd: 'computer_use', act: 'on' });
  });
});

describe('setup check (S.8)', () => {
  it('lists what bise needs with its fix; check again reads fresh', () => {
    const p = ports();
    const perm: string[] = [];
    view('setup', { ...p, perm: (x, a) => perm.push(`${x} ${a}`) }, { perms: { mic: 'allowed', accessibility: 'denied', screen: 'ask' }, accounts: accounts().map((a) => ({ ...a, state: 'signed_out' as const })) });
    const g = screen.getByTestId('settings.check');
    expect(g.textContent).toContain('denied');
    expect(screen.queryByTestId('settings.check.mic.fix')).toBeNull();
    fireEvent.click(screen.getByTestId('settings.check.accessibility.fix'));
    fireEvent.click(screen.getByTestId('settings.check.screen.fix'));
    fireEvent.click(screen.getByTestId('settings.check.model.fix'));
    fireEvent.click(screen.getByTestId('settings.check.again'));
    expect(perm).toEqual(['accessibility open', 'screen ask']);
    expect(p.went).toEqual(['models']);
    expect(p.sent).toEqual([{ cmd: 'setup_check' }]);
  });

  it('no helper: no permission rows; a gone home says to restart', () => {
    const list = checks({}, accounts(), projects().map((r) => (r.home ? { ...r, missing: true } : r)), false);
    expect(list.map((c) => [c.id, c.ok])).toEqual([
      ['model', true],
      ['home', false],
    ]);
    expect(list[1]?.detail).toContain('restart bise');
  });
});

describe('which model does what (V17) and a model with no key (L5)', () => {
  const MODELS: Model[] = [
    { id: 'anthropic/claude-opus-5-5', label: 'opus 5.5', provider: 'Anthropic', short: '1M', efforts: ['low', 'medium', 'high', 'max'], default_effort: 'high', provider_id: 'anthropic', key_ready: true },
    { id: 'mistral/devstral-medium-latest', label: 'devstral medium', provider: 'Mistral', short: '128k', provider_id: 'mistral', key_ready: false },
    { id: 'devstral', label: 'devstral', provider: '', short: '= mistral/devstral-medium-latest', alias_of: 'mistral/devstral-medium-latest' },
  ];
  const ROLES: RoleRow[] = [
    { role: 'main', name: 'main', about: 'your team lead', kind: 'chat', model: 'anthropic/claude-opus-5-5', effort: 'high', source: 'config' },
    { role: 'agents', name: 'agents', about: 'the tasks main starts', kind: 'chat', model: 'anthropic/claude-opus-5-5', source: 'default', follows: 'main' },
    { role: 'voice', name: 'voice', about: 'speech to text', kind: 'voice', model: 'mistral/voxtral-mini-latest', source: 'env' },
  ];
  const ACCOUNTS: Account[] = [
    { id: 'chatgpt', label: 'ChatGPT', kind: 'subscription', state: 'signed_in', provider: 'chatgpt' },
    { id: 'anthropic', label: 'Anthropic key', kind: 'key', state: 'signed_in', provider: 'anthropic' },
    { id: 'mistral', label: 'Mistral key', kind: 'key', state: 'signed_out', provider: 'mistral' },
  ];

  it('needsSetup: a model whose provider has no key names it; an alias follows its target; a ready one needs nothing', () => {
    expect(needsSetup('mistral/devstral-medium-latest', MODELS)).toBe('mistral');
    expect(needsSetup('devstral', MODELS)).toBe('mistral');
    expect(needsSetup('anthropic/claude-opus-5-5', MODELS)).toBeNull();
    expect(needsSetup('unknown/x', MODELS)).toBeNull();
    const held = { provider: 'mistral', providerName: 'Mistral', model: 'devstral medium', cmd: { cmd: 'role_set', role: 'main', model: 'mistral/devstral-medium-latest' } as AppCmd };
    expect(heldReady(held, ACCOUNTS)).toBe(false);
    expect(heldReady(held, ACCOUNTS.map((a) => (a.id === 'mistral' ? { ...a, state: 'signed_in' } : a)))).toBe(true);
  });

  it('modelOrSetup: sends a ready model at once, holds the other and opens the setup', () => {
    const sent: CoreCmd[] = [];
    const went: string[] = [];
    const ports = { send: (c: CoreCmd) => sent.push(c), setup: () => went.push('setup') };
    expect(modelOrSetup('anthropic/claude-opus-5-5', MODELS, { cmd: 'model', project: 'p', agent: 'main', model: 'anthropic/claude-opus-5-5' }, ports)).toBe('sent');
    expect(modelOrSetup('devstral', MODELS, { cmd: 'model', project: 'p', agent: 'main', model: 'devstral' }, ports)).toBe('setup');
    expect(sent.length).toBe(1);
    expect(went).toEqual(['setup']);
    releaseHeld();
  });

  it("each role shows its model, where it comes from, and its effort; setting main's effort sends role_set", () => {
    const p = ports();
    view('models', p, { roles: ROLES, models: MODELS, accounts: ACCOUNTS });
    const roles = screen.getByTestId('settings.roles');
    expect(roles.textContent).toContain('your team lead · set here');
    expect(roles.textContent).toContain('follows main');
    expect(roles.textContent).toContain('from your environment');
    expect(screen.getByTestId<HTMLSelectElement>('settings.role.main.model').value).toBe('anthropic/claude-opus-5-5');
    expect(screen.getByTestId<HTMLSelectElement>('settings.role.agents.model').value).toBe('');
    expect(screen.getByTestId('settings.role.voice.model').textContent).toBe('mistral/voxtral-mini-latest');
    expect(screen.getByTestId('settings.role.main.effort.2').className).toContain('on');
    fireEvent.click(screen.getByTestId('settings.role.main.effort.3'));
    expect(p.sent).toEqual([{ cmd: 'role_set', role: 'main', effort: 'max' }]);
    // back to its fallback: no model
    fireEvent.change(screen.getByTestId('settings.role.main.model'), { target: { value: '' } });
    expect(p.sent[1]).toEqual({ cmd: 'role_set', role: 'main', model: null });
  });

  it('L5: a model whose provider has no key is held, not sent; the setup asks for that provider, its key field open', () => {
    const p = ports();
    const held: Held[] = [];
    const r = view('models', { ...p, hold: (h) => held.push(h) }, { roles: ROLES, models: MODELS, accounts: ACCOUNTS });
    fireEvent.change(screen.getByTestId('settings.role.main.model'), { target: { value: 'mistral/devstral-medium-latest' } });
    expect(p.sent).toEqual([]);
    expect(held).toEqual([{ provider: 'mistral', providerName: 'Mistral', model: 'devstral medium', cmd: { cmd: 'role_set', role: 'main', model: 'mistral/devstral-medium-latest' } }]);
    r.rerender(<Settings page="models" prefs={prefs()} accounts={ACCOUNTS} projects={projects()} found={found()} plugins={null} computerUse={null} perms={{}} ports={p} roles={ROLES} models={MODELS} held={held[0] ?? null} />);
    expect(screen.getByTestId('settings.models.want').textContent).toBe("devstral medium needs Mistral: sign in or add its key here, then it's set.");
    expect(screen.getByTestId<HTMLInputElement>('settings.key.field').type).toBe('password');
    const f = screen.getByTestId<HTMLInputElement>('settings.key.field');
    f.value = 'mk-1';
    fireEvent.keyDown(f, { key: 'Enter' });
    expect(p.sent).toEqual([{ cmd: 'key_set', id: 'mistral', key: 'mk-1' }]);
  });

  it("a role_set the core refused says so in its words", () => {
    view('models', ports(), { roles: ROLES, models: MODELS, accounts: ACCOUNTS, roleError: 'no model named x' });
    expect(screen.getByTestId('settings.roles.error').textContent).toBe('no model named x');
  });
});
