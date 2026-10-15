// settings · approvals (bar V8 / W21, the TUI's /approvals, approvals_screen.rs): what runs without
// asking him in this repo: the mode (auto: the checker decides, else a notification; yolo: everything
// runs), the checker, and the saved rules ("always allow" on a notification adds one). Removing a rule
// asks inline first ("remove it? yes · keep it"), then the hub drops it from approvals.toml and
// every TUI hears the new list. Pure: draws the hub's typed approvals event (HubEv approvals,
// the store's useApprovals) and says what he changes (HubCmd approvals / remove_rule; a refusal
// comes as error {cmd: approvals|remove_rule}). The rules walk with the list keys (useListKeys).
// Owner: amb-mac (amb-kit's before).
import { useState } from 'react';
import { useListKeys } from '@/app/listkeys';
import { Act, Group, Help, Seg, type GroupItem } from '@/ds';
import type { ApprovalRule, HubCmd, HubEv } from '@/proto';
import { settings } from '@/proto/words.gen';

export type ApprovalsEv = Extract<HubEv, { ev: 'approvals' }>;
export type ApprovalsCmd = Extract<HubCmd, { cmd: 'approvals' | 'remove_rule' }>;

/** Its age in words: today, yesterday, 3 days ago, 2 weeks ago, 5 months ago; '' when unknown. */
export function age(days: number | null): string {
  if (days === null) return '';
  if (days <= 0) return settings.age_today;
  if (days === 1) return settings.age_yesterday;
  if (days < 14) return settings.age_days({ n: days });
  if (days < 60) return settings.age_weeks({ n: Math.floor(days / 7) });
  if (days < 730) return settings.age_months({ n: Math.floor(days / 30) });
  return settings.age_years({ n: Math.floor(days / 365) });
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
  if (a.checker === 'jev') return model !== '' ? settings.checker_model({ who: a.checker_who, model }) : settings.checker_jev({ who: a.checker_who });
  if (a.checker === 'model') return a.checker_who;
  if (a.checker === 'off') return settings.checker_off;
  return settings.checker_none;
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
  // the rules are a list (the TUI's /approvals, approvals_screen.rs:43-66): ↑/k ↓/j home/end move,
  // ⌫ or delete asks to remove the selected rule, ⏎ removes it, esc (or n) keeps it; a second esc
  // leaves settings. While it asks, the move keys stay put.
  const { sel, setSel, ref, onKeyDown } = useListKeys<HTMLDivElement>({
    order: (a?.rules ?? []).map((_, i) => String(i)),
    still: asking !== null,
    onKey: (e, sel) => {
      if (a === null || e.metaKey || e.ctrlKey || e.altKey) return false;
      if (asking !== null) {
        if (e.key === 'Enter' || e.key === 'y') {
          if (send) send({ cmd: 'remove_rule', project: a.project, rule: asking });
          setAsking(null);
          return true;
        }
        if (e.key === 'Escape' || e.key === 'n') {
          setAsking(null);
          return true;
        }
        return false;
      }
      const r = sel === null ? undefined : a.rules[Number(sel)];
      if ((e.key === 'Backspace' || e.key === 'Delete') && r !== undefined && send !== null) {
        setAsking(r);
        return true;
      }
      return false;
    },
  });
  if (a === null) return <Help testId="settings.approvals.none">{settings.approvals_none}</Help>;
  const modes = ['auto', 'yolo'] as const;
  const repo = a.repo === '' ? settings.approvals_this_repo : tilde(a.repo, home);
  const head: GroupItem[] = [
    {
      id: 'mode',
      label: settings.approvals_mode,
      sub: a.mode === 'yolo' ? settings.approvals_yolo : settings.approvals_auto,
      control: a.env ? (
        <span className="v">{settings.approvals_env({ mode: a.mode })}</span>
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
    { id: 'checker', label: settings.approvals_checker, sub: settings.approvals_checker_sub, value: checkerWords(a) },
  ];
  // rows by position: a rule has no id, its fields are its identity (sent back whole to remove it)
  const rules: GroupItem[] = a.rules.map((r, i) => ({
    id: String(i),
    label: ruleWhat(r),
    sub: ruleNote(r, now),
    control:
      asking === r ? (
        <span className="settings-row-acts" role="group" aria-label={settings.rule_remove_ask}>
          <span className="settings-ask">{settings.rule_remove_ask}</span>
          {/* designer m_18736: nothing ghost in rows; remove is an Act in the error tone, asked once */}
          <Act
            tone="err"
            onClick={() => {
              if (send) send({ cmd: 'remove_rule', project: a.project, rule: r });
              setAsking(null);
            }}
            testId={`settings.approvals.rule.${String(i)}.yes`}
          >
            {settings.rule_remove}
          </Act>
          <Act onClick={() => { setAsking(null); }} testId={`settings.approvals.rule.${String(i)}.keep`}>
            {settings.rule_keep}
          </Act>
        </span>
      ) : (
        <Act tone="err" disabled={send === null} onClick={() => { setAsking(r); }} testId={`settings.approvals.rule.${String(i)}.remove`}>
          {settings.rule_remove}
        </Act>
      ),
  }));
  return (
    <div ref={ref} tabIndex={-1} className="settings-approvals" onKeyDown={onKeyDown}>
      <Help testId="settings.approvals.repo">{settings.approvals_in({ repo })}</Help>
      <Group testId="settings.approvals" items={head} />
      {rules.length > 0 ? (
        <Group
          title={settings.approvals_rules}
          testId="settings.approvals.rules"
          list
          items={rules.map((it) => ({ ...it, sel: it.id === sel, onPick: () => { setSel(it.id); } }))}
        />
      ) : (
        <Help testId="settings.approvals.empty">{settings.approvals_empty}</Help>
      )}
      {error != null && error !== '' && (
        <Help err testId="settings.approvals.error">
          {error}
        </Help>
      )}
    </div>
  );
}
