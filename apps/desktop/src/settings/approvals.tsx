// settings · approvals (bar V8 / W21, the TUI's /approvals, approvals_screen.rs): what runs without
// asking him in this repo: the mode (auto: the checker decides, else a card; yolo: everything
// runs), the checker, and the saved rules ("always allow" on a card adds one). Removing a rule
// asks inline first ("remove it? yes · keep it"), then the hub drops it from approvals.toml and
// every TUI hears the new list. Pure: draws the hub's typed approvals event (HubEv approvals,
// the store's useApprovals) and says what he changes (HubCmd approvals / remove_rule; a refusal
// comes as error {cmd: approvals|remove_rule}). Owner: amb-kit.
import { useState } from 'react';
import { Button, Group, Help, Seg, type GroupItem } from '@/ds';
import type { ApprovalRule, HubCmd, HubEv } from '@/proto';

export type ApprovalsEv = Extract<HubEv, { ev: 'approvals' }>;
export type ApprovalsCmd = Extract<HubCmd, { cmd: 'approvals' | 'remove_rule' }>;

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

/** A rule's note as the TUI's list says it: its age (from added_ms, counted here: the hub never
 * sends 'today'), then the hub's note (its source, where it applies). */
export function ruleNote(r: ApprovalRule, now: number): string {
  const days = r.added_ms != null ? Math.floor((now - r.added_ms) / 86_400_000) : null;
  return [age(days), r.note ?? ''].filter((w) => w !== '').join(' · ');
}

/** What a rule allows: the hub's words, else its tool. */
export function ruleWhat(r: ApprovalRule): string {
  return r.what != null && r.what !== '' ? r.what : r.tool;
}

/** The checker in words (the TUI's). */
export function checkerWords(a: ApprovalsEv): string {
  const model = a.checker_model ?? '';
  if (a.checker === 'jev') return model !== '' ? `${a.checker_who} · ${model}` : `Jev · ${a.checker_who}`;
  if (a.checker === 'model') return a.checker_who;
  if (a.checker === 'off') return 'off · every command asks you';
  return 'none yet';
}

function tilde(p: string, home: string): string {
  return home !== '' && p.startsWith(home) ? `~${p.slice(home.length)}` : p;
}

export interface ApprovalsProps {
  /** the hub's approvals; null: not sent yet */
  approvals: ApprovalsEv | null;
  /** null: no hub to send them to */
  send: ((c: ApprovalsCmd) => void) | null;
  /** the hub's last refusal (error {cmd: approvals|remove_rule}), in its words */
  error?: string | null;
  /** his home folder, to say ~ */
  home?: string;
  now?: number;
}

export function Approvals({ approvals: a, send, error = null, home = '', now: pinned }: ApprovalsProps) {
  // the rules' ages are counted from when the page opened (a render reads no clock)
  const [opened] = useState(() => Date.now());
  const now = pinned ?? opened;
  // the rule whose remove asks now, inline: the row as it came (a new list folds the ask)
  const [asking, setAsking] = useState<ApprovalRule | null>(null);
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
            if (m !== undefined && m !== a.mode && send) send({ cmd: 'approvals', project: a.project, mode: m });
          }}
          testId="settings.approvals.switch"
        />
      ),
    },
    { id: 'checker', label: 'checker', sub: 'settings · models changes it', value: checkerWords(a) },
  ];
  // rows by position: a rule has no id, its fields are its identity (sent back whole to remove it)
  const rules: GroupItem[] = a.rules.map((r, i) => ({
    id: String(i),
    label: ruleWhat(r),
    sub: ruleNote(r, now),
    control:
      asking === r ? (
        <span className="settings-row-acts" role="group" aria-label="remove it?">
          <span className="settings-ask">remove it?</span>
          <Button
            kind="danger"
            onClick={() => {
              if (send) send({ cmd: 'remove_rule', project: a.project, rule: r });
              setAsking(null);
            }}
            testId={`settings.approvals.rule.${String(i)}.yes`}
          >
            remove
          </Button>
          <Button kind="ghost" onClick={() => { setAsking(null); }} testId={`settings.approvals.rule.${String(i)}.keep`}>
            keep it
          </Button>
        </span>
      ) : (
        <Button kind="ghost" disabled={send === null} onClick={() => { setAsking(r); }} testId={`settings.approvals.rule.${String(i)}.remove`}>
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
      {error != null && error !== '' && (
        <Help err testId="settings.approvals.error">
          {error}
        </Help>
      )}
    </div>
  );
}
