// A project's ⋯ menu in the sidebar (his m_26450: « les agents actifs, les agents non archivés, et
// les agents archivés en dessous, par ordre de priorité »; designer m_26470): its groups, its rows'
// marks and ends. Pure; Sidebar's ProjectMenu draws it in the ds Picker. One source with the right
// bar: a row's mark is the bar's (signOf, barSign; archived: '✓' '✗' '–' and its age, archivedRows),
// so the menu and the bar never disagree on an agent's state. Owner: amb-win.
import type { Agent } from '@/proto';
import { endOf, shortAge } from '@/agents/model';
import { signOf } from './side';
import { barSign, type BarRow } from './barrows';

/** A row: its agent, its mark (glyph and tone), its end words, whether the end is the accent. */
export interface MenuRow {
  agent: Agent;
  glyph: string;
  tone: BarRow['tone'];
  end: string;
  acc: boolean;
}

/** A group: its head, its rows, how many archived ones it left out (the '+ N more' row to /archived). */
export interface MenuGroup {
  head: 'active' | 'quiet' | 'archived';
  rows: MenuRow[];
  more: number;
}

/** A live agent's row: the bar's mark; 'waits' in the accent when it asks him, else the agents list's end. */
function liveRow(a: Agent, now: number): MenuRow {
  const s = barSign(signOf(a, now));
  return { agent: a, glyph: s.g, tone: s.tone, end: s.g === '?' ? 'waits' : endOf(a, now).text, acc: s.g === '?' };
}

/** An archived agent's row, as the bar's archived list: how it ended in the mark, its age at the end. */
function archivedRow(a: Agent, now: number): MenuRow {
  const st = a.status === 'done' ? '✓' : a.status === 'failed' ? '✗' : '–';
  return { agent: a, glyph: st, tone: st === '✗' ? 'err' : 'dim', end: shortAge(now - a.since_ms), acc: false };
}

/**
 * The menu's groups by priority: 'active', what needs him (its mark '?' asks him, '✗' failed) then
 * what works ('∿'); 'quiet', the other live ones; 'archived', the newest `cap`, the rest counted in
 * `more`. Newest first inside a rank (since_ms), then by name. Main is left out: the project row
 * opens it (designer m_26470). An empty group is left out. Pure.
 */
export function menuGroupsOf(agents: readonly Agent[], now: number, cap = 5): MenuGroup[] {
  const newest = (a: Agent, b: Agent) => b.since_ms - a.since_ms || a.name.localeCompare(b.name);
  const rank = (r: MenuRow): number => (r.glyph === '?' || r.glyph === '✗' ? 0 : r.glyph === '∿' ? 1 : 2);
  const live = agents
    .filter((a) => !a.archived && !a.main)
    .map((a) => liveRow(a, now))
    .sort((x, y) => rank(x) - rank(y) || newest(x.agent, y.agent));
  const archived = agents.filter((a) => a.archived && !a.main).sort(newest);
  const groups: MenuGroup[] = [
    { head: 'active', rows: live.filter((r) => rank(r) < 2), more: 0 },
    { head: 'quiet', rows: live.filter((r) => rank(r) === 2), more: 0 },
    { head: 'archived', rows: archived.slice(0, cap).map((a) => archivedRow(a, now)), more: Math.max(0, archived.length - cap) },
  ];
  return groups.filter((g) => g.rows.length > 0);
}
