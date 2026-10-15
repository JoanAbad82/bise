// settings · setup, "check again" (bar S.8, the TUI's /setup): what bise
// needs, each with its state and the fix it offers: the three permissions
// (the helper's: allow, or System Settings once refused), a model he is
// signed in to (else: models), and bise's home folder (the core makes it
// at its start; gone: restart bise). "check again" reads them fresh
// (`setup_check`: prefs, accounts and projects again; the helper's perms
// come on their own). Pure checks() plus its page. Owner: amb-home.
import type { Account, AppCmd, Grant, Perm, ProjectRow } from '@/proto';
import { Button, Chip, Group, Help, type GroupItem } from '@/ds';
import { settings } from '@/proto/words.gen';

export type Perms = Readonly<Partial<Record<Perm, Grant>>>;

/** what a check offers: a permission asked or its pane, the models page, nothing */
export type Fix = { t: 'perm'; perm: Perm; action: 'ask' | 'open' } | { t: 'models' } | null;

export interface Check {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  fix: Fix;
  /** its button's words */
  act?: string;
}

const PERM_WORDS: Record<string, [string, string]> = {
  mic: [settings.perm_mic, settings.perm_mic_lost],
  accessibility: [settings.perm_accessibility, settings.perm_accessibility_lost],
  screen: [settings.perm_screen, settings.perm_screen_lost],
};

/** What bise needs now, from the helper's perms, his accounts and his projects. */
export function checks(perms: Perms, accounts: readonly Account[], projects: readonly ProjectRow[], helper: boolean): Check[] {
  const out: Check[] = [];
  if (helper) {
    for (const p of ['mic', 'accessibility', 'screen'] as const) {
      const g = perms[p];
      const [label, lost] = PERM_WORDS[p] ?? [p, ''];
      out.push(
        g === 'allowed'
          ? { id: p, label, ok: true, detail: settings.perm_allowed, fix: null }
          : g === 'denied'
            ? { id: p, label, ok: false, detail: settings.perm_denied({ lost }), fix: { t: 'perm', perm: p, action: 'open' }, act: settings.open_system_settings }
            : { id: p, label, ok: false, detail: settings.perm_not_asked, fix: { t: 'perm', perm: p, action: 'ask' }, act: settings.perm_allow },
      );
    }
  }
  const signed = accounts.find((a) => a.state === 'signed_in');
  const expired = accounts.find((a) => a.state === 'expired');
  out.push(
    signed
      ? { id: 'model', label: settings.check_model, ok: true, detail: `${signed.label}${signed.who != null ? ` · ${signed.who}` : ''}`, fix: null }
      : { id: 'model', label: settings.check_model, ok: false, detail: expired ? settings.check_signed_out({ label: expired.label }) : settings.check_no_model, fix: { t: 'models' }, act: settings.sign_in },
  );
  const home = projects.find((p) => p.home);
  out.push(
    home === undefined
      ? { id: 'home', label: settings.check_home, ok: false, detail: settings.check_home_unknown, fix: null }
      : home.missing === true
        ? { id: 'home', label: settings.check_home, ok: false, detail: settings.check_home_gone({ path: home.path }), fix: null }
        : { id: 'home', label: settings.check_home, ok: true, detail: home.path, fix: null },
  );
  return out;
}

export interface CheckPorts {
  send: (cmd: AppCmd) => void;
  perm?: (perm: Perm, action: 'ask' | 'open') => void;
  models: () => void;
}

export function SetupCheck({ list, ports }: { list: readonly Check[]; ports: CheckPorts }) {
  const bad = list.filter((c) => !c.ok).length;
  const items: GroupItem[] = list.map((c) => ({
    id: c.id,
    label: c.label,
    sub: c.detail,
    control: c.ok ? (
      <Chip tone="ok">✓</Chip>
    ) : c.fix !== null && c.act !== undefined && (c.fix.t !== 'perm' || ports.perm) ? (
      <Button
        onClick={() => {
          const f = c.fix;
          if (f?.t === 'perm') ports.perm?.(f.perm, f.action);
          else if (f?.t === 'models') ports.models();
        }}
        testId={`settings.check.${c.id}.fix`}
      >
        {c.act}
      </Button>
    ) : (
      <Chip tone="err">{settings.check_needs_you}</Chip>
    ),
  }));
  return (
    <>
      <Group testId="settings.check" items={items} />
      <Help>{bad === 0 ? settings.check_all_set : settings.check_left({ n: bad })}</Help>
      <Button
        onClick={() => {
          ports.send({ cmd: 'setup_check' });
        }}
        testId="settings.check.again"
      >
        {settings.check_again}
      </Button>
    </>
  );
}
