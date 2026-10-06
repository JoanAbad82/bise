// The picker's rows for a trigger, and what picking one does. Pure: the plugin (Picker.tsx) asks
// for the rows when the trigger changes and applies the pick to the editor.
import type { PickAgent, PickCommand, PickFile, PickSkill } from './sources';
import { agentPick, filePick, prefixFirst, skillPick, type Trigger } from './tokens';

export interface Row {
  /** Stable per row, for React keys and the test id `composer.pick.<id>`. */
  readonly id: string;
  readonly label: string;
  readonly desc: string;
  /** A tag in front: `agent`, `dir`, `file`, `skill`, `cmd`. */
  readonly tag: 'agent' | 'dir' | 'file' | 'skill' | 'cmd';
  /** Greyed, `not yet`: shown, picking it does nothing (bar 2.1). */
  readonly off: boolean;
  readonly pick: Pick;
}

/** What a pick does: replace the trigger's word by `text` (and keep the list open on `browse`),
 *  or run the command now. */
export type Pick =
  | { readonly kind: 'insert'; readonly text: string; readonly browse: boolean }
  | { readonly kind: 'run'; readonly name: string };

/** At most this many rows in a list (the TUI's popup shows fewer; the rest is a query away). */
export const MAX_ROWS = 50;

export function agentRows(t: Trigger, agents: readonly PickAgent[]): Row[] {
  if (t.kind !== 'at' || t.quoted || t.query.includes('/')) return [];
  return prefixFirst(agents, t.query, (a) => a.name).map((a) => ({
    id: `agent.${a.name}`,
    label: `@${a.name}`,
    desc: a.desc ?? '',
    tag: 'agent',
    off: false,
    pick: { kind: 'insert', text: agentPick(a.name), browse: false },
  }));
}

export function fileRows(files: readonly PickFile[]): Row[] {
  return files.map((f) => {
    const p = filePick(f.path, f.dir);
    return { id: `file.${f.path}`, label: f.dir && !f.path.endsWith('/') ? `${f.path}/` : f.path, desc: '', tag: f.dir ? 'dir' : 'file', off: false, pick: { kind: 'insert', text: p.text, browse: p.browse } };
  });
}

export function skillRows(t: Trigger, skills: readonly PickSkill[]): Row[] {
  if (t.kind !== 'skill') return [];
  return prefixFirst(skills, t.query, (s) => s.name).map((s) => ({
    id: `skill.${s.name}`,
    label: `$${s.name}`,
    desc: s.desc,
    tag: 'skill',
    off: false,
    pick: { kind: 'insert', text: skillPick(s.name), browse: false },
  }));
}

/** The `/` list: the commands whose name starts with the query (commands.rs `popup_matches`). */
export function commandRows(t: Trigger, commands: readonly PickCommand[]): Row[] {
  if (t.kind !== 'slash') return [];
  const q = t.query.toLowerCase();
  return commands
    .filter((c) => c.name.replace(/^\//u, '').toLowerCase().startsWith(q))
    .map((c) => {
      const name = c.name.startsWith('/') ? c.name : `/${c.name}`;
      return {
        id: `cmd.${name.slice(1)}`,
        label: name,
        desc: c.ready ? c.desc : `${c.desc} · not yet`,
        tag: 'cmd',
        off: !c.ready,
        pick: c.args ? { kind: 'insert', text: `${name} `, browse: false } : { kind: 'run', name },
      };
    });
}

/** Tab on a row: always completes (a command's name, then its arguments), never runs. */
export function completion(row: Row): Pick {
  return row.pick.kind === 'run' ? { kind: 'insert', text: `${row.pick.name} `, browse: false } : row.pick;
}

/** The keyboard's row after a move: wraps at both ends, skips nothing (greyed rows are visible). */
export function move(index: number, by: number, length: number): number {
  if (length === 0) return 0;
  return (((index + by) % length) + length) % length;
}

/** A whole line `/name args` that names a known command: what ⏎ runs instead of sending. */
export function commandLine(text: string, commands: readonly PickCommand[]): { readonly name: string; readonly args: string; readonly ready: boolean } | null {
  const m = /^\/(\S+)(?:\s+([\s\S]*))?$/u.exec(text.trim());
  if (m === null) return null;
  const word = m[1] ?? '';
  const c = commands.find((x) => x.name.replace(/^\//u, '') === word);
  if (c === undefined) return null;
  return { name: `/${word}`, args: (m[2] ?? '').trim(), ready: c.ready };
}
