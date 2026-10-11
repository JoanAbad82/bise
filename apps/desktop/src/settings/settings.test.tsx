// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Account, AppCmd, Found, Model, ProjectRow, RoleRow } from '@/proto';
import type { CoreCmd } from '@/shared/api';
import { heldReady, modelOrSetup, needsSetup, releaseHeld, type Held } from './hold';
import { Approvals, checkerWords, ruleNote, ruleWhat } from './approvals';
import { Accounts, expiredWords } from './accounts';
import type { ApprovalsCmd, ApprovalsEv } from './approvals';
import type { ApprovalRule } from '@/proto';
import { core_ev, hub_ev } from '@/proto/fixtures.gen';
import { Settings, type SettingsPorts } from './Settings';
import { appName, excludedApps, flag, getPref, knownApps, onboarded, putPref, type Prefs } from './prefs';
import { addPaths, offers, ordered, projectSub } from './projects';
import { KEY_SECTIONS } from './keys';
import { notifyRow } from './pages';
import { checks } from './check';
import { FALLBACK } from './roles';

/** a role's model picker (the ds Select): open it from the keyboard, then pick that option */
function pickRole(role: string, value: string): void {
  const id = `settings.role.${role}.model`;
  fireEvent.keyDown(screen.getByTestId(id), { key: 'Enter' });
  fireEvent.click(screen.getByTestId(`${id}.opt.${value}`));
}

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
// the last projects line: the one a replay of the fixtures ends with (the first has a down hub)
const projects = (): ProjectRow[] => {
  const e = core_ev.filter((x) => x.ev === 'projects').at(-1);
  if (e?.ev !== 'projects') throw new Error('no projects fixture');
  return e.projects;
};
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
  it("a row says why its hub couldn't start, never a silent row (architect m_18354)", () => {
    const [p] = ordered(projects());
    if (p === undefined) throw new Error('no project');
    expect(projectSub(p)).toBe(p.path);
    const why = 'the hub did not start: sb-core: no such file (its log: /h/hub.err)';
    expect(projectSub({ ...p, down: why })).toBe(`${p.path} · ${why}`);
    expect(projectSub({ ...p, down: why, missing: true }), 'a gone folder says that first').toBe(`${p.path} · its folder is gone`);
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

  it("general: macOS notifications' row asks when never asked, opens System Settings when off or asked, says on, and is gone without the api", () => {
    expect(notifyRow(null)).toBeNull();
    expect(notifyRow('never')?.act).toBe('ask');
    expect(notifyRow('asked')?.act).toBe('open');
    expect(notifyRow('off')).toEqual({ sub: 'off in macOS: questions wait in bise until you look', act: 'open', button: 'open System Settings' });
    expect(notifyRow('on')?.act).toBeNull();
    const acts: string[] = [];
    const p = { ...ports(), notify: (a: 'ask' | 'open') => acts.push(a) };
    view('general', p, { notify: 'off' });
    fireEvent.click(screen.getByTestId('settings.notify.open'));
    cleanup();
    view('general', p, { notify: 'never' });
    fireEvent.click(screen.getByTestId('settings.notify.ask'));
    expect(acts).toEqual(['open', 'ask']);
    cleanup();
    view('general', p, { notify: 'on' });
    expect(screen.getByTestId('settings.notify.on').textContent).toBe('on');
    cleanup();
    view('general', p);
    expect(screen.queryByTestId('settings.notify.sub')).toBeNull();
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
    expect(screen.getByTestId('settings.role.main.model').textContent).toContain('opus 5.5');
    expect(screen.getByTestId('settings.role.agents.model').textContent).toContain('as main');
    expect(screen.getByTestId('settings.role.voice.model').textContent).toBe('mistral/voxtral-mini-latest');
    expect(screen.getByTestId('settings.role.main.effort.2').className).toContain('on');
    fireEvent.click(screen.getByTestId('settings.role.main.effort.3'));
    expect(p.sent).toEqual([{ cmd: 'role_set', role: 'main', effort: 'max' }]);
    // back to its fallback: no model
    pickRole('main', FALLBACK);
    expect(p.sent[1]).toEqual({ cmd: 'role_set', role: 'main', model: null });
  });

  it('L5: a model whose provider has no key is held, not sent; the setup asks for that provider, its key field open', () => {
    const p = ports();
    const held: Held[] = [];
    const r = view('models', { ...p, hold: (h) => held.push(h) }, { roles: ROLES, models: MODELS, accounts: ACCOUNTS });
    pickRole('main', 'mistral/devstral-medium-latest');
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

describe('approvals (V8 / W21) on the typed HubEv approvals, and the expired sign-in (V14 / S28 / L2)', () => {
  const NOW = 1791100400000;
  // rules as the hub sends them: the toml's fields (their identity) + the TUI's words, no age
  const R: ApprovalRule[] = [
    { tool: 'bash', pattern: 'cargo test *', project: '/Users/camille/acme', added: '2026-10-02', from: 'card #12, api-v2', added_ms: NOW - 3 * 86_400_000, what: 'cargo test *', note: 'from api-v2' },
    { tool: 'edit', path: '/Users/camille/notes', what: 'edits to ~/notes', note: 'every project' },
    { tool: 'gmail.send_email', what: 'gmail.send_email', note: 'a connector' },
  ];
  const A: ApprovalsEv = {
    ev: 'approvals', project: 'acme-1a2b3c4d', mode: 'auto', env: false, checker: 'jev', checker_who: 'TypeSafe', checker_model: 'jev-1.13', repo: '/Users/camille/acme', rules: R,
  };

  it("says each rule in the TUI's words, its age counted here from added_ms", () => {
    expect(ruleWhat(R[0] as ApprovalRule)).toBe('cargo test *');
    expect(ruleWhat(R[1] as ApprovalRule)).toBe('edits to ~/notes');
    expect(ruleWhat({ tool: 'gmail.send_email' })).toBe('gmail.send_email');
    expect(ruleNote(R[0] as ApprovalRule, NOW)).toBe('3 days ago · from api-v2');
    expect(ruleNote(R[0] as ApprovalRule, NOW + 4 * 86_400_000)).toBe('7 days ago · from api-v2');
    expect(ruleNote(R[1] as ApprovalRule, NOW)).toBe('every project');
    expect(ruleNote({ tool: 'bash', added_ms: NOW }, NOW)).toBe('today');
    expect(checkerWords(A)).toBe('TypeSafe · jev-1.13');
    expect(checkerWords({ ...A, checker: 'off' })).toBe('off · every command asks you');
    expect(checkerWords({ ...A, checker: 'unknown' })).toBe('none yet');
  });

  it('the fixture approvals event draws (yolo forced by the environment, no rules)', () => {
    const ev = hub_ev.find((e) => e.ev === 'approvals' && e.env);
    expect(ev?.ev).toBe('approvals');
    if (ev?.ev !== 'approvals') return;
    render(<Approvals approvals={ev} send={null} home="/Users/me" now={NOW} />);
    expect(screen.getByTestId('settings.approvals.repo').textContent).toBe('what runs without asking you in ~/acme.');
    expect(screen.getByTestId('settings.approvals').textContent).toContain('yolo · this session (BISE_APPROVALS)');
  });

  it('the mode switches, a rule asks before it goes and is sent back whole, keep it keeps it, a refusal shows', () => {
    const sent: ApprovalsCmd[] = [];
    const r = render(<Approvals approvals={A} send={(c) => sent.push(c)} home="/Users/camille" now={NOW} />);
    expect(screen.getByTestId('settings.approvals.repo').textContent).toBe('what runs without asking you in ~/acme.');
    fireEvent.click(screen.getByTestId('settings.approvals.switch.1'));
    expect(sent).toEqual([{ cmd: 'approvals', project: 'acme-1a2b3c4d', mode: 'yolo' }]);
    fireEvent.click(screen.getByTestId('settings.approvals.rule.0.remove'));
    expect(screen.getByTestId('settings.approvals.rules').textContent).toContain('remove it?');
    fireEvent.click(screen.getByTestId('settings.approvals.rule.0.keep'));
    expect(sent.length).toBe(1);
    fireEvent.click(screen.getByTestId('settings.approvals.rule.0.remove'));
    fireEvent.click(screen.getByTestId('settings.approvals.rule.0.yes'));
    expect(sent[1]).toEqual({ cmd: 'remove_rule', project: 'acme-1a2b3c4d', rule: R[0] });
    // the hub's fresh list (the rule gone, every row a new object, as parsed JSON) folds any ask;
    // a refusal says so under the list
    fireEvent.click(screen.getByTestId('settings.approvals.rule.1.remove'));
    const fresh = R.slice(1).map((x) => ({ ...x }));
    r.rerender(<Approvals approvals={{ ...A, rules: fresh }} send={(c) => sent.push(c)} error="that rule is already gone" now={NOW} />);
    expect(screen.getByTestId('settings.approvals.rules').textContent).not.toContain('remove it?');
    expect(screen.getByTestId('settings.approvals.error').textContent).toBe('that rule is already gone');
  });

  it('a mode forced by the environment is said, not switched; no rule yet says how one comes; nothing sent yet says so', () => {
    const { rerender } = render(<Approvals approvals={{ ...A, env: true, rules: [] }} send={null} now={NOW} />);
    expect(screen.queryByTestId('settings.approvals.switch')).toBeNull();
    expect(screen.getByTestId('settings.approvals').textContent).toContain('auto · this session (BISE_APPROVALS)');
    expect(screen.getByTestId('settings.approvals.empty').textContent).toContain('always allow');
    rerender(<Approvals approvals={null} send={null} now={NOW} />);
    expect(screen.getByTestId('settings.approvals.none')).toBeTruthy();
  });

  it('an expired subscription names the agents it stopped; sign in again shows the wait, c copies the link, esc cancels', () => {
    const p = ports();
    const copied: string[] = [];
    const cancelled: string[] = [];
    const accts: Account[] = [{ id: 'chatgpt', label: 'ChatGPT', kind: 'subscription', state: 'expired' }];
    const r = render(<Accounts accounts={accts} send={p.send} signin={{ waiting: ['main', 't1'] }} copy={(t) => copied.push(t)} cancelSignIn={(id) => cancelled.push(id)} />);
    expect(screen.getByTestId('settings.models').textContent).toContain('your sign-in expired: main, t1 wait');
    fireEvent.click(screen.getByTestId('settings.account.chatgpt'));
    expect(p.sent).toEqual([{ cmd: 'sign_in', id: 'chatgpt' }]);
    r.rerender(<Accounts accounts={accts} send={p.send} signin={{ waiting: ['main', 't1'], signing: { id: 'chatgpt', url: 'https://auth.openai.com/x' } }} copy={(t) => copied.push(t)} cancelSignIn={(id) => cancelled.push(id)} />);
    const box = screen.getByTestId('settings.signing');
    expect(box.textContent).toContain('waiting for you to sign in to ChatGPT in your browser…');
    fireEvent.keyDown(box, { key: 'c' });
    expect(copied).toEqual(['https://auth.openai.com/x']);
    fireEvent.keyDown(box, { key: 'Escape' });
    expect(cancelled).toEqual(['chatgpt']);
  });

  it('expiredWords says who waits', () => {
    expect(expiredWords([])).toBe('your sign-in expired: sign in again');
    expect(expiredWords(['main'])).toBe('your sign-in expired: main waits');
    expect(expiredWords(['a', 'b', 'c', 'd'])).toBe('your sign-in expired: a, b and 2 more wait');
  });
});
