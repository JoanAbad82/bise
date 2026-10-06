// settings · setup, "check again" (bar S.8, the TUI's /setup): what bise
// needs, each with its state and the fix it offers: the three permissions
// (the helper's: allow, or System Settings once refused), a model he is
// signed in to (else: models), and bise's home folder (the core makes it
// at its start; gone: restart bise). "check again" reads them fresh
// (`setup_check`: prefs, accounts and projects again; the helper's perms
// come on their own). Pure checks() plus its page. Owner: amb-home.
import type { Account, AppCmd, Grant, Perm, ProjectRow } from '@/proto';
import { Button, Chip, Group, Help, type GroupItem } from '@/ds';

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
  mic: ['microphone', "fn can't hear you without it"],
  accessibility: ['accessibility', 'fn works only in bise’s own windows without it'],
  screen: ['screen recording', 'fn sends your words without a capture without it'],
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
          ? { id: p, label, ok: true, detail: 'allowed', fix: null }
          : g === 'denied'
            ? { id: p, label, ok: false, detail: `denied: ${lost}`, fix: { t: 'perm', perm: p, action: 'open' }, act: 'open System Settings' }
            : { id: p, label, ok: false, detail: 'not asked yet', fix: { t: 'perm', perm: p, action: 'ask' }, act: 'allow' },
      );
    }
  }
  const signed = accounts.find((a) => a.state === 'signed_in');
  const expired = accounts.find((a) => a.state === 'expired');
  out.push(
    signed
      ? { id: 'model', label: 'a model', ok: true, detail: `${signed.label}${signed.who != null ? ` · ${signed.who}` : ''}`, fix: null }
      : { id: 'model', label: 'a model', ok: false, detail: expired ? `${expired.label}: signed out, sign in again` : 'no subscription or key yet: agents can’t answer', fix: { t: 'models' }, act: 'sign in' },
  );
  const home = projects.find((p) => p.home);
  out.push(
    home === undefined
      ? { id: 'home', label: 'bise’s home', ok: false, detail: 'not known yet: check again in a moment', fix: null }
      : home.missing === true
        ? { id: 'home', label: 'bise’s home', ok: false, detail: `${home.path} is gone: restart bise and it makes it again`, fix: null }
        : { id: 'home', label: 'bise’s home', ok: true, detail: home.path, fix: null },
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
      <Chip tone="err">needs you</Chip>
    ),
  }));
  return (
    <>
      <Group testId="settings.check" items={items} />
      <Help>{bad === 0 ? 'all set.' : `${String(bad)} ${bad === 1 ? 'thing needs' : 'things need'} you.`}</Help>
      <Button
        onClick={() => {
          ports.send({ cmd: 'setup_check' });
        }}
        testId="settings.check.again"
      >
        check again
      </Button>
    </>
  );
}
