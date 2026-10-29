// What a live project's tray line says under its name, and its submenu's agents (his ask, main
// m_29563; designer m_29577). The second line: what waits on him first ('? search · which size
// system…', from its first card), else its newest-active working agent's note or title ('perf ·
// merging the cache fix', '+2' the others at work). bise's own line: what waits on him from bise,
// else bise's note, else nothing. The submenu: the project's live agents, waiting first, then at
// work, then the rest live (a pause, waiting on someone), each with its doing age ('4m').
// Everything comes from what the hub already sends (rows, agents, cards). Pure: MenuProjects says it.
import { shownName } from '@/agents/model';
import type { SpotAgent, SpotCard, SpotData } from '@/spotlight';

export type Summary =
  | { readonly kind: 'wait'; readonly who: string; readonly text: string }
  | { readonly kind: 'work'; readonly who: string; readonly text: string; readonly more: number }
  | { readonly kind: 'note'; readonly text: string };

const firstLine = (s: string): string => (s.split('\n')[0] ?? '').trim();
const isLiveAgent = (a: SpotAgent): boolean => a.archived !== true;
const words = (a: SpotAgent): string => firstLine(a.note !== undefined && a.note.trim() !== '' ? a.note : a.title !== '' ? a.title : (a.purpose ?? ''));

/** The project's cards, in the inbox's order (spot.cards is). */
const cardsOf = (spot: SpotData, project: string): readonly SpotCard[] => spot.cards.filter((c) => c.project === project);

/**
 * A live line's second line: its first card, else its newest-active working agent (note, else
 * title) and how many others work; bise's home (`home`): its first card, else main's note. null:
 * nothing to say. Pure.
 */
export function summaryOf(spot: SpotData, project: string, home = false): Summary | null {
  const card = cardsOf(spot, project)[0];
  if (card !== undefined) return { kind: 'wait', who: shownName(card.agent), text: firstLine(card.text) };
  const mine = spot.agents.filter((a) => a.project === project && isLiveAgent(a));
  if (home) {
    const note = mine.find((a) => a.main === true)?.note?.trim() ?? '';
    return note === '' ? null : { kind: 'note', text: firstLine(note) };
  }
  const work = mine.filter((a) => a.status === 'working').sort((a, b) => (b.since ?? 0) - (a.since ?? 0));
  const top = work[0];
  if (top === undefined) return null;
  return { kind: 'work', who: shownName(top.name), text: words(top), more: work.length - 1 };
}

/** A submenu row's rank: what asks him, then at work, then the rest live; -1: not live. */
function rankOf(a: SpotAgent, asks: ReadonlySet<string>): number {
  if (asks.has(a.name) || a.sign?.g === '?') return 0;
  if (a.status === 'working') return 1;
  if (a.status === 'waiting' || a.status === 'blocked' || a.sign?.g === '…') return 2;
  return -1;
}

export interface SubAgent {
  readonly name: string;
  /** its shown name ('bise' for main) */
  readonly shown: string;
  readonly sign: { readonly g: string; readonly tone: 'ink' | 'acc' | 'err' | 'dim' };
  readonly words: string;
  readonly since: number | null;
}

/** The submenu's agents: waiting on him first, then at work, then the rest live, each group newest first. Pure. */
export function subAgents(spot: SpotData, project: string): readonly SubAgent[] {
  const asks = new Set(cardsOf(spot, project).map((c) => c.agent));
  return spot.agents
    .filter((a) => a.project === project && isLiveAgent(a))
    .map((a) => ({ a, r: rankOf(a, asks) }))
    .filter((x) => x.r >= 0)
    .sort((x, y) => x.r - y.r || (y.a.since ?? 0) - (x.a.since ?? 0))
    .map(({ a, r }) => ({
      name: a.name,
      shown: shownName(a.name),
      sign: r === 0 ? { g: '?', tone: 'acc' as const } : (a.sign ?? { g: a.status === 'working' ? '∿' : '⋯', tone: a.status === 'working' ? ('ink' as const) : ('dim' as const) }),
      words: words(a),
      since: a.since ?? null,
    }));
}

/** How long it does what it does now, the menu's short form: 'now', '4m', '2h', '3d'. Pure. */
export function ageShort(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${String(m)}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${String(h)}h` : `${String(Math.floor(h / 24))}d`;
}

/** The submenu's head words: '2 working · 1 waiting for you' (the parts that are there). Pure. */
export function subHead(working: number, waits: number): string {
  const parts: string[] = [];
  if (working > 0) parts.push(`${String(working)} working`);
  if (waits > 0) parts.push(`${String(waits)} waiting for you`);
  return parts.join(' · ');
}

/** The submenu's width (designer m_29577: the window grows 340 → 620 while it is open). */
export const SUB_W = 280;

/**
 * Which side the submenu opens on: the right when the screen has room past the menu, else the
 * left (a tray icon near the screen's right edge). Pure.
 */
export function subSide(menuX: number, menuW: number, screenX: number, screenW: number): 'right' | 'left' {
  return menuX + menuW + SUB_W <= screenX + screenW || menuX - SUB_W < screenX ? 'right' : 'left';
}

/** A point. */
export interface Pt {
  readonly x: number;
  readonly y: number;
}

/**
 * The hover's safe triangle (a native menu's): the pointer moving from `from` toward the
 * submenu's near edge (its top `a` and bottom `b` corners) is on its way there, so the row under
 * it doesn't take the submenu over. Pure.
 */
export function inTriangle(p: Pt, from: Pt, a: Pt, b: Pt): boolean {
  const side = (u: Pt, v: Pt, w: Pt): number => (u.x - w.x) * (v.y - w.y) - (v.x - w.x) * (u.y - w.y);
  const d1 = side(p, from, a);
  const d2 = side(p, a, b);
  const d3 = side(p, b, from);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
