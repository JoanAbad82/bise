// The right bar's worktrees and PRs (designer's desktop-agents-bar §3-§4), as the TUI's panel draws
// them (rust/tui/src/sb/places.rs, sb.rs blocks): an agent alone in its worktree carries its mark
// in the row's last column ('↑' a PR, '…' its land waits, 'ψ' no PR), 2 or more live agents in one
// worktree are a group under a 'ψ <branch>' head, an open PR with no live agent is a row of its own.
// The words are the hub's (`Pr.words`, `Place.lid`), never rebuilt here. Pure. Owner: amb-win.
import type { Agent, Card, Place, Pr } from '@/proto';
import { panel } from '@/proto/words_panel.gen';

/** A mark's tint: accent (an inbox card asks him to merge it), err (its checks fail), mid (text-2), dim (text-3). */
export type MarkTone = 'acc' | 'err' | 'mid' | 'dim';

export interface Mark {
  /** '↑' a PR, '…' its land waits, 'ψ' a worktree, 'Δ' a feature's try build */
  readonly g: string;
  readonly tone: MarkTone;
  /** the TUI's words for it: '#415 · checks fail: e2e/login · ψ worktree on sb/checkout' */
  readonly tip: string;
  /** the same, its branch and folder apart (mono in the tip) */
  readonly parts: readonly TipPart[];
  /** its open PR's number and link, when it has one */
  readonly pr?: number;
  readonly url?: string;
}

/** The PR when it is open or a draft (merged and closed draw nothing; a feature never has one). */
export function livePr(p: Place): Pr | null {
  const pr = p.pr;
  return p.feature !== true && pr != null && (pr.state === 'open' || pr.state === 'draft') ? pr : null;
}

/** Its land waits in the queue to main: its rank in the line is 2 or more (`Place.landing`, 1 lands now). */
export function waitsToLand(p: Place): boolean {
  return p.landing != null && p.landing >= 2;
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

/** A piece of a tip: words (text-2), or a branch or a folder (`mono`, text). */
export interface TipPart {
  readonly t: string;
  readonly mono?: boolean;
}

/** A tip's parts as one string (aria-label, title). */
export const tipString = (parts: readonly TipPart[]): string => parts.map((x) => x.t).join('');

/** A path with `home` folded to '~'. */
export function tilde(path: string, home: string | undefined): string {
  return home !== undefined && home !== '' && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

/**
 * What a ψ is (wt-sign, designer m_24019; the TUI's sb/psi_tip.rs): 'ψ worktree: its own copy of the
 * repo, on sb/fix-login · ~/.bise/worktrees/harness/fix-login'; 2 or more agents 'ψ worktree shared by
 * 3 agents, on …'; detached ', no branch'; a feature 'ψ feature branch ven: its agents land on it',
 * 'Δ feature ven: its try build is running'. The folder: `Place.path`, else a private one's id. Pure.
 */
export function worktreeParts(p: Place, home?: string): TipPart[] {
  const label = placeLabel(p);
  if (p.feature === true) {
    return p.trying === true
      ? [{ t: panel.wt_feature({ g: 'Δ' }) }, { t: label, mono: true }, { t: panel.wt_feature_trying }]
      : [{ t: panel.wt_feature_branch({ g: 'ψ' }) }, { t: label, mono: true }, { t: panel.wt_feature_lands }];
  }
  const n = (p.agents ?? []).length;
  const who = n >= 2 ? panel.wt_shared({ g: 'ψ', n }) : panel.wt_own({ g: 'ψ' });
  const out: TipPart[] = p.branch != null && p.branch !== '' ? [{ t: panel.wt_on({ who }) }, { t: p.branch, mono: true }] : [{ t: panel.wt_no_branch({ who }) }];
  const path = p.path ?? (p.id.startsWith('pt:') ? p.id.slice(3) : undefined);
  if (path !== undefined && path !== '') out.push({ t: ' · ' }, { t: tilde(path, home), mono: true });
  return out;
}

/**
 * The tip (places.rs words_line): the hub's lid, else '#415 · ' and the PR's words, then ' · ψ worktree
 * on <branch>'; nothing of a PR or a land to say: what the worktree is ([`worktreeParts`]).
 */
export function tipParts(p: Place, home?: string): TipPart[] {
  const pr = livePr(p);
  const said = p.lid != null && p.lid !== '' ? p.lid : pr !== null ? `#${String(pr.number)} · ${pr.words !== '' ? pr.words : panel.pr_open}` : null;
  if (said === null) return worktreeParts(p, home);
  return [{ t: panel.wt_said_on({ said, g: 'ψ' }) }, { t: placeLabel(p), mono: true }];
}

/** [`tipParts`] as one string. */
export const tipWords = (p: Place, home?: string): string => tipString(tipParts(p, home));

/**
 * Its mark (places.rs row_mark), first that applies: '…' text-2 while its land waits; no open PR:
 * 'ψ' text-2 ('Δ' a feature's try build); '↑' text-3 when the forge is late, red when its checks
 * fail, accent when a card asks him to merge it, text-3 a draft, text-2 open. Pure.
 */
export function markOf(p: Place, asks: boolean, home?: string): Mark {
  const parts = tipParts(p, home);
  const tip = tipString(parts);
  if (waitsToLand(p)) return { g: '…', tone: 'mid', tip, parts };
  const pr = livePr(p);
  if (pr === null) return { g: p.feature === true && p.trying === true ? 'Δ' : 'ψ', tone: 'mid', tip, parts };
  const stale = pr.stale_ms != null;
  const fails = pr.checks === 'fail';
  const tone: MarkTone = !stale && !fails && asks ? 'acc' : stale || pr.state === 'draft' ? 'dim' : fails ? 'err' : 'mid';
  return { g: '↑', tone, tip, parts, pr: pr.number, url: pr.url };
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
