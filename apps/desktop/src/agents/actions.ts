// Starting, renaming and tuning an agent (bar A.1, A.5; amb-feed 6cb6c0ef's
// typed HubCmds new / rename / model / effort, which run the TUI's /new,
// /rename, /model, /reasoning handlers). One function each, so the window's
// screens and amb-home's slash dispatch call the same thing. A refusal comes
// back as the hub's error {cmd, text}; a change shows in the next agents
// event. Owner: amb-win.
import type { Agent, HubCmd, Model, Worktree } from '@/proto';

/** What sends a command (the store's `command`). */
export interface Sender {
  command: (cmd: HubCmd) => void;
}

export interface NewAgent {
  readonly brief: string;
  /** none: the hub names it from the brief */
  readonly name?: string;
  /** its own worktree (a branch of its own) */
  readonly worktree?: boolean;
  /** carry his uncommitted changes into its worktree */
  readonly withChanges?: boolean;
}

/** The `new` command for a sheet's fields; undefined when there's nothing to send. Pure. */
export function newCmd(project: string, n: NewAgent): Extract<HubCmd, { cmd: 'new' }> | undefined {
  const brief = n.brief.trim();
  if (brief === '') return undefined;
  const name = n.name?.trim() ?? '';
  return {
    cmd: 'new',
    project,
    brief,
    ...(name !== '' ? { name } : {}),
    ...(n.worktree === true ? { worktree: true } : {}),
    ...(n.worktree === true && n.withChanges === true ? { with_changes: true } : {}),
  };
}

export function newAgent(s: Sender, project: string, n: NewAgent): boolean {
  const c = newCmd(project, n);
  if (c === undefined) return false;
  s.command(c);
  return true;
}

/** Why a new name can't be (the hub refuses it too; this says it before ⏎). Pure. */
export function nameProblem(name: string, agents: readonly Agent[], self?: string): string | undefined {
  const n = name.trim();
  if (n === '') return 'a name, please';
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(n)) return 'letters, digits and dashes only';
  if (n === 'main') return "'main' is the project's own";
  if (n !== self && agents.some((a) => a.name === n)) return `${n} exists already`;
  return undefined;
}

export function renameAgent(s: Sender, project: string, agent: string, to: string): boolean {
  const t = to.trim();
  if (t === '' || t === agent) return false;
  s.command({ cmd: 'rename', project, agent, to: t });
  return true;
}

export function setModel(s: Sender, project: string, agent: string, model: string, asDefault = false): boolean {
  const m = model.trim();
  if (m === '') return false;
  s.command({ cmd: 'model', project, agent, model: m, ...(asDefault ? { default: true } : {}) });
  return true;
}

/** The TUI's /reasoning levels, with its hints (rust/tui/src/commands.rs effort_hint). */
export const EFFORTS: readonly { readonly effort: string; readonly hint: string }[] = [
  { effort: 'low', hint: 'faster, cheaper' },
  { effort: 'medium', hint: 'balanced' },
  { effort: 'high', hint: 'deeper, slower' },
];

export function setEffort(s: Sender, project: string, agent: string, effort: string): boolean {
  const e = effort.trim();
  if (e === '') return false;
  s.command({ cmd: 'effort', project, agent, effort: e });
  return true;
}

/** The models to offer: the ones this project's agents run, the agent's own first. Pure. */
export function modelChoices(agents: readonly Agent[], current: string | null | undefined): string[] {
  const out: string[] = [];
  for (const m of [current, ...agents.map((a) => a.model)]) if (m != null && m !== '' && !out.includes(m)) out.push(m);
  return out;
}

/** His checkout has uncommitted changes (the worktree with no agent). Pure. */
export function hasChanges(worktrees: readonly Worktree[]): boolean {
  return worktrees.some((w) => w.agent == null && w.dirty);
}

/** The TUI's /model list (amb-feed 7dfd1c74): under each provider's name, then the aliases ("" provider). Pure. */
export function modelGroups(models: readonly Model[]): { head: string; rows: Model[] }[] {
  const out: { head: string; rows: Model[] }[] = [];
  for (const m of models) {
    const head = m.provider === '' ? 'aliases' : m.provider;
    const g = out.find((x) => x.head === head);
    if (g) g.rows.push(m);
    else out.push({ head, rows: [m] });
  }
  return out;
}

/** The catalog row a model id names (an alias resolved to its model). Pure. */
export function modelOf(models: readonly Model[], id: string | null | undefined): Model | undefined {
  if (id == null || id === '') return undefined;
  const m = models.find((x) => x.id === id);
  if (m?.alias_of != null) return models.find((x) => x.id === m.alias_of) ?? m;
  return m;
}

/**
 * The reasoning choices for a model: its catalog efforts; [] when the
 * catalog lists it without a setting (say so, as the hub's refusal does);
 * the TUI's usual three when the catalog doesn't know it (a typed id). Pure.
 */
export function effortsFor(models: readonly Model[], id: string | null | undefined): readonly string[] {
  const m = modelOf(models, id);
  if (m === undefined) return EFFORTS.map((e) => e.effort);
  return m.efforts ?? [];
}

/** 'default for main and agents' from a row's default_for, '' when none. Pure. */
export function defaultWords(m: Model): string {
  const roles = m.default_for ?? [];
  return roles.length === 0 ? '' : `default for ${roles.join(' and ')}`;
}
