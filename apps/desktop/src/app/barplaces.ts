// The right bar's worktrees and PRs (designer's desktop-agents-bar §3-§4), as the TUI's panel draws
// them (rust/tui/src/sb/places.rs, sb.rs blocks): an agent alone in its worktree carries its mark
// in the row's last column ('↑' a PR, '…' its land waits, 'ψ' no PR), 2 or more live agents in one
// worktree are a group under a 'ψ <branch>' head, an open PR with no live agent is a row of its own.
// The words are the hub's (`Pr.words`, `Place.lid`), never rebuilt here. Pure. Owner: amb-win.
import type { Agent, Card, Place, Pr } from '@/proto';

/** A mark's tint: accent (an inbox card asks him to merge it), err (its checks fail), mid (text-2), dim (text-3). */
export type MarkTone = 'acc' | 'err' | 'mid' | 'dim';

export interface Mark {
  /** '↑' a PR, '…' its land waits, 'ψ' a worktree, 'Δ' a feature's try build */
  readonly g: string;
  readonly tone: MarkTone;
  /** the TUI's words for it: '#415 · checks fail: e2e/login · ψ sb/checkout' */
  readonly tip: string;
  /** its open PR's number and link, when it has one */
  readonly pr?: number;
  readonly url?: string;
}

/** The PR when it is open or a draft (merged and closed draw nothing; a feature never has one). */
export function livePr(p: Place): Pr | null {
  const pr = p.pr;
  return p.feature !== true && pr != null && (pr.state === 'open' || pr.state === 'draft') ? pr : null;
}

/**
 * Its land waits in the queue to main. The hub says it only in its lid's words today ('waits to
 * land · 2nd'), as the TUI reads it (places.rs waits_to_land); `Place.landing` replaces this test.
 */
export function waitsToLand(p: Place): boolean {
  return (p.lid ?? '').startsWith('waits to land');
}

/** Its name: the branch, else a private worktree's folder ('pt:<path>'), else its id. */
export function placeLabel(p: Place): string {
  if (p.branch != null && p.branch !== '') return p.branch;
  if (p.id.startsWith('pt:')) {
    const parts = p.id.slice(3).replace(/\/+$/, '').split('/');
    const i = parts.lastIndexOf('worktrees');
    return (i >= 0 && parts.length === i + 4 ? parts[i + 2] : parts.at(-1)) ?? p.id;
  }
  return p.id;
}

/**
 * An inbox card asks him to merge `p`'s PR (pr-design §6.3, sb.rs asks_merge): a 'merge' card that
 * names the place, or (an older hub) one of its agents or its number.
 */
export function asksMerge(p: Place, cards: readonly Card[]): boolean {
  const pr = livePr(p);
  if (pr === null) return false;
  const tag = new RegExp(`#${String(pr.number)}(?!\\d)`);
  return cards.some((c) => {
    if (c.kind !== 'merge') return false;
    if (c.place != null) return c.place === p.id;
    return c.pr === pr.number || (p.agents ?? []).includes(c.agent) || tag.test(`${c.question} ${c.text ?? ''}`);
  });
}

/** The worktree `a` works in, when the hub sent it (main never: the shared checkout). */
export function placeOf(a: Agent, places: readonly Place[]): Place | undefined {
  if (a.main) return undefined;
  return places.find((p) => (p.agents ?? []).includes(a.name) || (a.place_id !== undefined && a.place_id !== '' && p.id === a.place_id));
}

/**
 * The tip's words (places.rs words_line): the hub's lid, else '#415 · ' and the PR's words; then
 * 'ψ <branch>' when the branch isn't the agent's own ('sb/<name>'), last so a cut eats it first.
 * `name`: the row's agent; none (a head, an orphan PR) the row already says the branch.
 */
export function tipWords(p: Place, name?: string): string {
  const pr = livePr(p);
  const parts: string[] = [];
  if (p.lid != null && p.lid !== '') parts.push(p.lid);
  else if (pr !== null) parts.push(`#${String(pr.number)} · ${pr.words !== '' ? pr.words : 'open'}`);
  const label = placeLabel(p);
  if (name !== undefined && label.split('/').at(-1) !== name) parts.push(`ψ ${label}`);
  // nothing else to say (no PR yet, its own sb/<name>): the worktree it is in
  return parts.length > 0 ? parts.join(' · ') : `ψ ${label}`;
}

/**
 * Its mark (places.rs row_mark), first that applies: '…' text-2 while its land waits; no open PR:
 * 'ψ' text-2 ('Δ' a feature's try build); '↑' text-3 when the forge is late, red when its checks
 * fail, accent when a card asks him to merge it, text-3 a draft, text-2 open. Pure.
 */
export function markOf(p: Place, asks: boolean, name?: string): Mark {
  const tip = tipWords(p, name);
  if (waitsToLand(p)) return { g: '…', tone: 'mid', tip };
  const pr = livePr(p);
  if (pr === null) return { g: p.feature === true && p.trying === true ? 'Δ' : 'ψ', tone: 'mid', tip };
  const stale = pr.stale_ms != null;
  const fails = pr.checks === 'fail';
  const tone: MarkTone = !stale && !fails && asks ? 'acc' : stale || pr.state === 'draft' ? 'dim' : fails ? 'err' : 'mid';
  return { g: '↑', tone, tip, pr: pr.number, url: pr.url };
}

/** The worktrees whose live agents are 2 or more: a group each (sb.rs shared). */
export function sharedPlaces(places: readonly Place[], live: readonly Agent[]): Map<string, Agent[]> {
  const out = new Map<string, Agent[]>();
  for (const p of places) {
    const in_ = live.filter((a) => placeOf(a, places) === p);
    if (in_.length >= 2) out.set(p.id, in_);
  }
  return out;
}

/** The worktrees with an open PR and no live agent: a row with no sign each (sb.rs orphans). */
export function orphanPlaces(places: readonly Place[], live: readonly Agent[]): Place[] {
  return places.filter((p) => livePr(p) !== null && !live.some((a) => placeOf(a, places) === p));
}
