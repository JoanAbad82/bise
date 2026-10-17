// A feature test's inputs (fast-try p5, architect m_29407), typed from bise-proto's generated
// types: the core's and the hubs' events, the window-local answers main sends the window that
// asked (src/main/core/ipc.ts), and his gestures. Every default comes from that tag's first line
// in src/proto/fixtures.gen.ts (rust/proto/fixtures), never a hand-kept value, so a proto change
// breaks a builder or a test at typecheck and the compiler shows what to fix. Test-only (never in
// the bundle): a feature test imports this and run.ts, nothing else of the app (eslint).
import type { AnswerResult, Card, CoreEv, CoreCmd, HubEv, ProjectRow } from './app';
import { core_ev, hub_ev } from './app';

export type Ev = HubEv | CoreEv;
export type Tag = Ev['ev'];
export type EvOf<T extends Tag> = Extract<Ev, { ev: T }>;
/** An event's fields over its fixture's (Partial distributes over a tag with several shapes). */
export type Over<T extends Tag> = Partial<Omit<EvOf<T>, 'ev'>>;

const FIXTURES: readonly Ev[] = [...hub_ev, ...core_ev];

/** The first fixture line of `tag` (a tag without one has no defaults: give them all). */
function fixtureOf<T extends Tag>(tag: T): EvOf<T> | null {
  return (FIXTURES.find((e) => e.ev === tag) as EvOf<T> | undefined) ?? null;
}

/**
 * One event of the core or a hub: its fixture's fields, then `over`'s. `ev('cards', { project,
 * cards: [card({ id: 9 })], others: [] })`. A tag no fixture has: `over` must hold every field
 * (the cast is checked by the fixtures test: every Tag has a fixture today).
 */
export function ev<T extends Tag>(tag: T, over: Over<T> = {}): EvOf<T> {
  return { ...(fixtureOf(tag) ?? {}), ...over, ev: tag } as EvOf<T>;
}

/** The first card of the fixtures' `cards` event. */
const CARD: Card = (() => {
  const c = fixtureOf('cards')?.cards[0];
  if (c === undefined) throw new Error('rust/proto/fixtures has no cards event with a card');
  return c;
})();

/** A card: the fixtures' first, then `over` (give `project` and `id`). */
export function card(over: Partial<Card> & Pick<Card, 'project' | 'id'>): Card {
  return { ...CARD, ...over };
}

/** The fixtures' first project row that has cards (the ProjectRow every default comes from). */
const ROW: ProjectRow = (() => {
  for (const e of core_ev) {
    if (e.ev !== 'projects') continue;
    const r = e.projects.find((p) => p.cards !== undefined);
    if (r !== undefined) return r;
  }
  throw new Error('rust/proto/fixtures has no projects row with cards');
})();

/** A project row (the sidebar's and the inbox's source): the fixtures' first with cards, then `over`. */
export function row(over: Partial<ProjectRow> & Pick<ProjectRow, 'project' | 'name'>): ProjectRow {
  return { ...ROW, cards: [], waits: 0, home: false, ...over };
}

/** The core's `projects` event with these rows. */
export const projects = (...rows: ProjectRow[]): EvOf<'projects'> => ev('projects', { projects: rows });

// ---- the window-local answers (main's ipc.ts sends them to the window that asked; not in the
// core's protocol, so typed here from the proto's result types)

/** The hub took his answer to `card` (card/answer's AnswerResult; no `answer`: a page took it). */
export interface CardAnsweredEv {
  readonly ev: 'card_answered';
  readonly project: string;
  readonly card: number;
  readonly answer?: AnswerResult['answer'];
}
/** The core or its hub refused his answer or close of that card, with its words. */
export interface CardRefusedEv {
  readonly ev: 'card_refused';
  readonly project: string;
  readonly card: number;
  readonly text: string;
}
/** His send's result: the message id the hub gave it (null: none). */
export interface SentEv {
  readonly ev: 'sent';
  readonly project: string;
  readonly agent: string;
  readonly cid: number;
  readonly msg_id: number | null;
}
export type LocalEv = CardAnsweredEv | CardRefusedEv | SentEv;

export const cardAnswered = (project: string, card: number, answer?: AnswerResult['answer']): CardAnsweredEv =>
  ({ ev: 'card_answered', project, card, ...(answer === undefined ? {} : { answer }) });
export const cardRefused = (project: string, card: number, text: string): CardRefusedEv => ({ ev: 'card_refused', project, card, text });
export const sent = (project: string, agent: string, cid: number, msgId: number | null = null): SentEv =>
  ({ ev: 'sent', project, agent, cid, msg_id: msgId });

/** Anything given to the window: a core or hub event, or main's window-local answer. */
export type Input = Ev | LocalEv;

// ---- his gestures (what he does; run.ts turns each into the app's own call)

/** Where he is when he answers: a project's agent's thread, or the inbox screen. */
export type Here = { readonly project: string; readonly agent: string } | 'inbox';

export type Gesture =
  | { readonly g: 'answer'; readonly project: string; readonly card: number; readonly reply: string; readonly from?: Here }
  | { readonly g: 'close'; readonly project: string; readonly card: number }
  | { readonly g: 'retry'; readonly project: string; readonly card: number }
  | { readonly g: 'send'; readonly project: string; readonly agent: string; readonly text: string }
  | { readonly g: 'open'; readonly project: string; readonly agent: string };

export const answer = (project: string, card: number, reply: string, from?: Here): Gesture =>
  ({ g: 'answer', project, card, reply, ...(from === undefined ? {} : { from }) });
export const close = (project: string, card: number): Gesture => ({ g: 'close', project, card });
export const retry = (project: string, card: number): Gesture => ({ g: 'retry', project, card });
export const send = (project: string, agent: string, text: string): Gesture => ({ g: 'send', project, agent, text });
/** He switches to that project's agent's thread (the sidebar, a link, ⌘1-9). */
export const open = (project: string, agent = 'main'): Gesture => ({ g: 'open', project, agent });

/** A command that left the window for the core (bise-proto's AppCmd | HubCmd). */
export type Cmd = CoreCmd;
