// src/app/side3d · a coin's card (page folded-side v9, Gabriel's pick: D1's words on ⌥ or hover;
// designer m_45474): its name and two quiet lines, what waits, what failed, what comes next. ⌥
// held alone 300 ms shows all four (with their keys), a hover 400 ms one; at rest, none. Each line
// is parts: plain (text-2 on line 1, text-3 on line 2), 'acc' (what waits, the accent at 600),
// 'err' (a failure, --c-err), 'chip' (an artifact's name, its pink chip), 'mono' (a command), 'link'
// (a port, ':5173 ↗'). From typed rows only, never from words. Pure. Owner: nm-side.
import type { Agent, Proc, ScheduledTask } from '@/proto';
import { ago } from '@/agents/model';
import { ahead, asks } from '@/scheduled/model';
import { isRunning, rowCmd } from '@/running/model';
import { side } from '@/proto/words_side.gen';
import { bubbleName, bubbleSays, type Counts } from './model';
import type { BubbleId } from './objects';

/** a command as he typed it, as the processes float's row (FlyoutLists typed) */
function typed(p: Pick<Proc, 'cmd' | 'cwd'>): string {
  const c = rowCmd(p.cmd, p.cwd);
  return c.args === '' ? c.prog : `${c.prog} ${c.args}`;
}

/** One run of a card's line, and how it reads. */
export interface CardPart {
  readonly text: string;
  readonly tone?: 'acc' | 'err' | 'chip' | 'mono' | 'link';
}

/** A coin's card: its name, line 1, line 2 (none: a quiet coin's one line). */
export interface CoinCard {
  readonly name: string;
  readonly l1: readonly CardPart[];
  readonly l2: readonly CardPart[];
}

/** What the four cards read: the live agents in rank, the project's artifacts, timers and running processes, the agents with a watch. */
export interface CardFacts {
  readonly live: readonly Agent[];
  readonly counts: Counts;
  readonly artifacts: readonly { readonly a: { readonly title: string; readonly at_ms: number; readonly new: boolean } }[];
  readonly tasks: readonly { readonly t: ScheduledTask }[];
  readonly procs: readonly { readonly p: Proc }[];
  readonly watching: readonly string[];
  readonly now: number;
}

/** a timer within this long says 'in 12 min', later 'at 07:30' */
const SOON_MS = 60 * 60_000;
/** askers named whole before 'and N more' */
const NAMED = 3;

const plain = (text: string): CardPart => ({ text });

/** 'perf asks you', 'perf and docs ask you', 'perf, api-auth and i18n ask you', past three 'perf, api-auth and 2 more ask you'. Pure. */
export function asksYou(names: readonly string[]): string {
  if (names.length === 1) return side.card_asks_one({ agent: names[0] ?? '' });
  if (names.length <= NAMED) return side.card_asks_many({ names: names.slice(0, -1).join(', '), last: names[names.length - 1] ?? '' });
  return side.card_asks_many({ names: names.slice(0, NAMED - 1).join(', '), last: side.card_more({ n: names.length - (NAMED - 1) }) });
}

const sameDay = (a: number, b: number): boolean => new Date(a).toDateString() === new Date(b).toDateString();

function agentsCard(f: CardFacts): Pick<CoinCard, 'l1' | 'l2'> {
  const askers = f.live.filter((a) => a.waits > 0).map((a) => a.name);
  const failed = f.live.filter((a) => !a.main && a.status === 'failed');
  const failedPart: CardPart | null = failed.length === 0 ? null
    : { text: failed.length === 1 ? side.card_failed_one({ agent: failed[0]?.name ?? '' }) : side.card_failed({ n: failed.length }), tone: 'err' };
  const working: CardPart | null = f.counts.working > 0 ? plain(side.working({ n: f.counts.working })) : null;
  const some = (xs: readonly (CardPart | null)[]): CardPart[] => xs.filter((x): x is CardPart => x !== null);
  if (askers.length > 0) return { l1: [{ text: asksYou(askers), tone: 'acc' }], l2: some([working, failedPart]) };
  if (failedPart !== null) return { l1: [failedPart], l2: some([working]) };
  if (working !== null) return { l1: [working], l2: [] };
  const last = f.live.filter((a) => !a.main && a.status === 'done').sort((x, y) => y.since_ms - x.since_ms)[0];
  return { l1: [plain(side.card_quiet)], l2: last === undefined ? [] : [plain(side.card_finished({ agent: last.name, ago: ago(last.since_ms, f.now) }))] };
}

function artifactsCard(f: CardFacts): Pick<CoinCard, 'l1' | 'l2'> {
  const newest = [...f.artifacts].sort((x, y) => y.a.at_ms - x.a.at_ms)[0];
  if (newest === undefined) return { l1: [plain(side.no_artifacts)], l2: [] };
  const today = f.artifacts.filter((x) => x.a.new && sameDay(x.a.at_ms, f.now)).length;
  const all = side.card_in_all({ n: f.artifacts.length });
  return {
    l1: [{ text: newest.a.title, tone: 'chip' }],
    l2: [plain(today > 0 ? `${side.card_new_today({ n: today })} · ${all}` : `${all} · ${side.card_last({ ago: ago(newest.a.at_ms, f.now) })}`)],
  };
}

function scheduledCard(f: CardFacts): Pick<CoinCard, 'l1' | 'l2'> {
  const next = f.tasks.filter((x) => x.t.next_ms != null).sort((x, y) => (x.t.next_ms ?? 0) - (y.t.next_ms ?? 0))[0];
  const tail = [
    f.counts.timers > 0 ? side.timers({ n: f.counts.timers }) : '',
    f.counts.watches > 0 ? side.watches({ n: f.counts.watches }) : '',
    f.watching.length === 1 ? (f.watching[0] ?? '') : '',
  ].filter((s) => s !== '').join(' · ');
  if (next === undefined) {
    if (tail === '') return { l1: [plain(side.card_no_scheduled)], l2: [] };
    return { l1: [plain(tail)], l2: [] };
  }
  const at = next.t.next_ms ?? f.now;
  const what = asks(next.t);
  const l1 = at - f.now < SOON_MS ? side.card_due_in({ what, ago: ago(f.now, at) }) : side.card_due_at({ what, at: ahead(at, f.now) });
  return { l1: [plain(l1)], l2: tail === '' ? [] : [plain(tail)] };
}

function processesCard(f: CardFacts): Pick<CoinCard, 'l1' | 'l2'> {
  const running = f.procs.map((x) => x.p).filter(isRunning);
  const first = running.find((p) => (p.ports ?? []).length > 0) ?? running[0];
  if (first === undefined) return { l1: [plain(side.card_no_processes)], l2: [] };
  const port = (first.ports ?? [])[0];
  return {
    l1: [{ text: typed(first), tone: 'mono' }, ...(port === undefined ? [] : [{ text: `:${String(port)} ↗`, tone: 'link' as const }])],
    l2: [plain(bubbleSays('processes', f.counts))],
  };
}

/** A coin's card from the rows. Pure. */
export function coinCard(b: BubbleId, f: CardFacts): CoinCard {
  const lines = b === 'agents' ? agentsCard(f) : b === 'artifacts' ? artifactsCard(f) : b === 'scheduled' ? scheduledCard(f) : processesCard(f);
  return { name: bubbleName(b), ...lines };
}

/** A card as one line of words, for its VoiceOver name and its tip: 'Agents · perf asks you · 2 working · search-ui failed'. Pure. */
export const cardWords = (c: CoinCard): string => [c.name, ...[c.l1, c.l2].map((l) => l.map((p) => p.text).join(' · '))].filter((s) => s !== '').join(' · ');
