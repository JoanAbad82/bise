// settings · approvals (bar V8 / W21, the TUI's /approvals, approvals_screen.rs): what runs without
// asking him in this repo: the mode (auto: the checker decides, else a card; yolo: everything
// runs), the checker, and the saved rules ("always allow" on a card adds one). Removing a rule
// asks inline first ("remove it? yes · keep it"), then the hub drops it from approvals.toml and
// every TUI hears the new list. Pure: draws the hub's approvals (draft.ts until typed) and says
// what he changes. Owner: amb-kit.
import { useState } from 'react';
import { Button, Group, Help, Seg, type GroupItem } from '@/ds';
import type { ApprovalsCmd, ApprovalsDraft, RuleDraft } from './draft';

const EDIT_TOOLS = ['edit', 'write_file', 'apply_patch'];

/** What a rule allows, as the TUI's list says it: `cargo test *`, `edits to ~/notes`, `gmail.send_email`. */
export function ruleWhat(r: RuleDraft, home = ''): string {
  if (r.path !== '') return `edits to ${tilde(r.path, home)}`;
  if (r.tool === 'bash' || (EDIT_TOOLS.includes(r.tool) && r.pattern === '')) return r.pattern === '' ? r.tool : r.pattern;
  return r.pattern === '' ? r.tool : `${r.tool} ${r.pattern}`;
}

/** Its age in words: today, yesterday, 3 days ago, 2 weeks ago, 5 months ago; '' when unknown. */
export function age(days: number | null): string {
  if (days === null) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${String(days)} days ago`;
  if (days < 60) return `${String(Math.floor(days / 7))} weeks ago`;
  if (days < 730) return `${String(Math.floor(days / 30))} months ago`;
  return `${String(Math.floor(days / 365))} years ago`;
}

/** Where it came from: the card's agents (from api-v2, 3 agents), or the file's own words. */
export function source(from: string): string {
  const parts = from.split(', ').filter((p) => p !== '');
  const first = parts[0];
  if (first === undefined) return '';
  if (first.startsWith('card')) {
    const names = parts.slice(1);
    if (names.length === 0) return 'from a card';
    if (names.length === 1) return `from ${names[0] ?? ''}`;
    return `${String(names.length)} agents`;
  }
  return `from ${from}`;
}

/** A rule's note: its age, its source, where it applies. */
export function ruleNote(r: RuleDraft, now: number): string {
  const days = r.added != null ? Math.floor((now - r.added) / 86_400_000) : null;
  const v = [age(days), source(r.from)].filter((w) => w !== '');
  if (v.length === 0 && r.tool.includes('.') && r.pattern === '' && r.path === '') v.push('a connector');
  if (r.every) v.push('every project');
  if (r.outside) v.push('outside the sandbox');
  return v.join(' · ');
}

/** The checker in words (the TUI's). */
export function checkerWords(a: ApprovalsDraft): string {
  if (a.checker === 'jev') return a.checker_model !== '' ? `${a.checker_who} · ${a.checker_model}` : `Jev · ${a.checker_who}`;
  if (a.checker === 'model') return a.checker_who;
  if (a.checker === 'off') return 'off · every command asks you';
  return 'none yet';
}

function tilde(p: string, home: string): string {
  return home !== '' && p.startsWith(home) ? `~${p.slice(home.length)}` : p;
}

export interface ApprovalsProps {
  /** the hub's approvals; null: not sent yet */
  approvals: ApprovalsDraft | null;
  /** null: the window can't send them yet (the hub's commands are not typed) */
  send: ((c: ApprovalsCmd) => void) | null;
  /** his home folder, to say ~ */
  home?: string;
  now?: number;
}

export function Approvals({ approvals: a, send, home = '', now: pinned }: ApprovalsProps) {
  // the rules' ages are counted from when the page opened (a render reads no clock)
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  // the rule whose remove asks now (its id), inline
  const [asking, setAsking] = useState<string | null>(null);
  if (a === null) return <Help testId="settings.approvals.none">the hub hasn't sent its approvals yet.</Help>;
  const modes = ['auto', 'yolo'] as const;
  const repo = a.repo === '' ? 'this repo' : tilde(a.repo, home);
  const head: GroupItem[] = [
    {
      id: 'mode',
      label: 'mode',
      sub: a.mode === 'yolo' ? 'everything runs, no card' : 'the checker decides; else a card asks you',
      control: a.env ? (
        <span className="v">{`${a.mode} · this session (BISE_APPROVALS)`}</span>
      ) : (
        <Seg
          items={modes}
          on={Math.max(0, modes.indexOf(a.mode as (typeof modes)[number]))}
          onPick={(i) => {
            const m = modes[i];
            if (m !== undefined && m !== a.mode && send) send({ cmd: 'approvals', mode: m });
          }}
          testId="settings.approvals.switch"
        />
      ),
    },
    { id: 'checker', label: 'checker', sub: 'settings · models changes it', value: checkerWords(a) },
  ];
  const rules: GroupItem[] = a.rules.map((r) => ({
    id: r.id,
    label: ruleWhat(r, home),
    sub: ruleNote(r, now),
    control:
      asking === r.id ? (
        <span className="settings-row-acts" role="group" aria-label="remove it?">
          <span className="settings-ask">remove it?</span>
          <Button
            kind="danger"
            onClick={() => {
              if (send) send({ cmd: 'remove_rule', rule: r.id });
              setAsking(null);
            }}
            testId={`settings.approvals.rule.${r.id}.yes`}
          >
            remove
          </Button>
          <Button kind="ghost" onClick={() => { setAsking(null); }} testId={`settings.approvals.rule.${r.id}.keep`}>
            keep it
          </Button>
        </span>
      ) : (
        <Button kind="ghost" disabled={send === null} onClick={() => { setAsking(r.id); }} testId={`settings.approvals.rule.${r.id}.remove`}>
          remove
        </Button>
      ),
  }));
  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Escape' && asking !== null) {
          // esc keeps the rule; a second esc leaves settings
          e.preventDefault();
          setAsking(null);
        }
      }}
    >
      <Help testId="settings.approvals.repo">{`what runs without asking you in ${repo}.`}</Help>
      <Group testId="settings.approvals" items={head} />
      {rules.length > 0 ? (
        <Group title="always allowed here" testId="settings.approvals.rules" items={rules} />
      ) : (
        <Help testId="settings.approvals.empty">nothing yet: a card's “always allow” adds a rule here.</Help>
      )}
      {a.error != null && a.error !== '' && (
        <Help err testId="settings.approvals.error">
          {a.error}
        </Help>
      )}
    </div>
  );
}
