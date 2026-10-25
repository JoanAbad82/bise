// src/app/side3d · what the right side says (page native-mac §7, mockups 11-15): each bubble's
// count and tip, an agent's comic bubble (asks, talks, thinks, idle) from its typed state, the
// agents in the hub's rank, an asking agent's buttons and the intent each sends (the inbox's own
// store.do pick, no second path). No order computed here: the agents take rows::Agent.rank through
// agents/model rankedOf, the cards Card.rank through inbox/order sortCards. Pure. Owner: nm-side.
import type { Agent, Card } from '@/proto';
import { liveOf, rankedOf } from '@/agents/model';
import { sortCards } from '@/inbox/order';
import { takesWords } from '@/inbox/model';
import type { AnswerAt } from '@/store/answered';
import type { Intent } from '@/store/machine/types';
import { side } from '@/proto/words_side.gen';
import type { BubbleId } from './objects';

/** What the four bubbles count, from the store's rows. */
export interface Counts {
  /** live agents working (main out), and agents that ask him something */
  readonly working: number;
  readonly asks: number;
  /** agents working or asking, each once: the agents bubble's number */
  readonly busy: number;
  readonly artifacts: number;
  readonly newArtifacts: number;
  readonly timers: number;
  readonly watches: number;
  readonly running: number;
  /** processes that ended today (the processes head's 'done today') */
  readonly doneToday: number;
}

/** The agents' part of the counts. Pure. */
export function agentCounts(agents: readonly Agent[]): Pick<Counts, 'working' | 'asks' | 'busy'> {
  const live = agents.filter((a) => !a.archived);
  const working = live.filter((a) => !a.main && a.status === 'working');
  const asking = live.filter((a) => a.waits > 0);
  const busy = live.filter((a) => (!a.main && a.status === 'working') || a.waits > 0);
  return { working: working.length, asks: asking.length, busy: busy.length };
}

/** A bubble's count pill: its number (none at 0) and whether it is the accent (an agent asks). Pure. */
export function bubbleCount(b: BubbleId, c: Counts): { readonly n: number; readonly accent: boolean } {
  switch (b) {
    case 'agents':
      return { n: c.busy, accent: c.asks > 0 };
    case 'artifacts':
      return { n: c.newArtifacts, accent: false };
    case 'scheduled':
      return { n: c.timers + c.watches, accent: false };
    case 'processes':
      return { n: c.running, accent: false };
  }
}

/** A bubble's name, as its card's head says it. Pure. */
export function bubbleName(b: BubbleId): string {
  return { agents: side.agents, artifacts: side.artifacts, scheduled: side.scheduled, processes: side.processes }[b];
}

/** What a bubble's card head says after its name ('3 working · 1 asks'); '' when nothing. Pure. */
export function bubbleSays(b: BubbleId, c: Counts): string {
  const parts: string[] = [];
  switch (b) {
    case 'agents':
      if (c.working > 0) parts.push(side.working({ n: c.working }));
      if (c.asks > 0) parts.push(side.asks({ n: c.asks }));
      break;
    case 'artifacts':
      if (c.newArtifacts > 0) parts.push(side.new_count({ n: c.newArtifacts }));
      else if (c.artifacts > 0) parts.push(side.artifact_count({ n: c.artifacts }));
      break;
    case 'scheduled':
      if (c.timers > 0) parts.push(side.timers({ n: c.timers }));
      if (c.watches > 0) parts.push(side.watches({ n: c.watches }));
      break;
    case 'processes':
      if (c.running > 0) parts.push(side.running({ n: c.running }));
      if (c.doneToday > 0) parts.push(side.done_today({ n: c.doneToday }));
      break;
  }
  return parts.join(' · ');
}

/** A bubble's tip and VoiceOver name: 'Agents · 3 working · 1 asks'. Pure. */
export function bubbleTip(b: BubbleId, c: Counts): string {
  const says = bubbleSays(b, c);
  return side.bubble_tip({ name: bubbleName(b), says: says === '' ? side.bubble_none : says });
}

/** The live agents in the hub's order: main first, then rows::Agent.rank (rankedOf's slots, nothing sorted here). Pure. */
export function inRank(agents: readonly Agent[]): Agent[] {
  const live = liveOf(agents);
  const slots = rankedOf(live);
  const out: (Agent | undefined)[] = live.map(() => undefined);
  for (const a of live) out[slots.get(a.name) ?? 0] = a;
  return out.filter((a): a is Agent => a !== undefined);
}

/** An agent's comic bubble. */
export type Speech =
  /** it asks him: its first open card in the inbox's order */
  | { readonly k: 'asks'; readonly card: Card }
  /** it works: what it says it does, italic, the thinking dots */
  | { readonly k: 'thinks'; readonly text: string }
  /** it said something: its last report */
  | { readonly k: 'talks'; readonly text: string }
  /** at rest with nothing to say: its title */
  | { readonly k: 'idle'; readonly text: string };

/** An agent's bubble from its typed state: a card first, then working, then its report. `cards`: the project's open cards. Pure. */
export function speechOf(a: Agent, cards: readonly Card[]): Speech {
  const card = sortCards(cards.filter((c) => c.agent === a.name))[0];
  if (card !== undefined) return { k: 'asks', card };
  const says = (a.note ?? '') !== '' ? (a.note ?? '') : a.title !== '' ? a.title : a.purpose;
  if (a.status === 'working') return { k: 'thinks', text: says };
  if (a.report != null && a.report.text !== '') return { k: 'talks', text: a.report.text };
  return { k: 'idle', text: says };
}

/** The word after an agent's name on its bubble ('perf · asks'). Pure. */
export function speechWord(s: Speech): string {
  return { asks: side.state_asks, thinks: side.state_thinks, talks: side.state_talks, idle: side.state_idle }[s.k];
}

/** How many of a card's options show as buttons (24 high, in a 252 bubble): the rest are the inbox's. */
export const SHOWN_OPTS = 2;

/** An asking agent's buttons: the card's first options (the hub's labels), then 'answer…' when words answer it. Pure. */
export function askButtons(c: Card): { readonly opts: readonly { readonly n: number; readonly label: string }[]; readonly words: boolean } {
  return { opts: c.options.slice(0, SHOWN_OPTS).map((o) => ({ n: o.n, label: o.label })), words: takesWords(c) };
}

/** The intent an option button sends: the inbox's pick, from where he is. Pure. */
export function pickIntent(c: Pick<Card, 'project' | 'id'>, n: number, at: AnswerAt | null): Intent {
  return { i: 'pick', project: c.project, card: c.id, n, from: { at } };
}

/** Where he answers from, as the inbox says it (Block answerAt): the thread in view, else bise's main. Pure. */
export function answerFrom(here: { readonly project: string | null; readonly agent: string | null }, home: string): AnswerAt | null {
  if (here.project !== null && here.agent !== null) return { project: here.project, agent: here.agent };
  if (here.project === null && here.agent === null && home !== '') return { project: home, agent: 'main' };
  return null;
}
