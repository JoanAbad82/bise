// The store's shapes: the typed event union, TAGS (every tag the store applies,
// checked complete at compile time), the slices' list types, and the key and
// compare helpers. Pure, no state. Split out of store.ts (pure move). Owner:
// amb-core (the hub slices with amb-win).
import type { AwayProject, CoreEv, HubEv, Mode, Pr, PickFile, PickFolder, BranchRow, Page, VersionItem } from '@/proto';
export type Ev = HubEv | CoreEv;
export type EvOf<T extends Ev['ev']> = Extract<Ev, { ev: T }>;

/** Every typed tag the store applies; the compiler checks it names each tag of HubEv | CoreEv, no more. */
export const TAGS = {
  welcome: true,
  agents: true,
  cards: true,
  thread: true,
  entry: true,
  typing: true,
  artifacts: true,
  scheduled: true,
  worktrees: true,
  dev_servers: true,
  merged: true,
  features: true,
  prs: true,
  models: true,
  tool_out: true,
  // the answer to queued_take (turn/unqueue): his taken-back words, to the asking window (main 34c35175)
  queued_taken: true,
  // the answer to log (log/read): a page of an agent's raw session, read through onEvent by the
  // window's /log screen (main 0c227ae3)
  log: true,
  diff: true,
  route: true,
  route_done: true,
  jobs: true,
  job_end: true,
  followed_end: true,
  confirm: true,
  approvals: true,
  notice: true,
  error: true,
  projects: true,
  open: true,
  prefs: true,
  accounts: true,
  found: true,
  away_summary: true,
  plugins: true,
  computer_use: true,
  dictation: true,
  voice_mode: true,
  voice_answer: true,
  level: true,
  heard: true,
  commands: true,
  skills: true,
  files: true,
  roles: true,
  signing: true,
  app_update: true,
  hub_refused: true,
  index: true,
  setup_first: true,
  keychain: true,
  computer_live: true,
  computer_peek: true,
  refused: true,
  // client-protocol's newer HubEv tags (main 0c3be6b6), applied since amb-win's (amb-feed m_16785):
  // state per project (branches, versions, flow, pages, release, update), moments read through
  // onEvent (page_changed, card_open, focused)
  branches: true,
  card_open: true,
  flow: true,
  focused: true,
  page_changed: true,
  pages: true,
  release: true,
  update: true,
  versions: true,
} as const satisfies Record<Ev['ev'], true>;

/** A raw event from the core as a typed one, or null (not an object, or a tag the store doesn't know). */
/** A project's branches, the hub's answer to branches (the /diff branch picker; amb-feed m_16785). */
export interface BranchesList {
  readonly base: string;
  readonly rows: readonly BranchRow[];
}

/** bise's versions as its hub sees them (/version: current, the list, dev/installed). */
export interface VersionsList {
  readonly current: string;
  readonly dev: boolean;
  readonly installed: boolean;
  readonly items: readonly VersionItem[];
}

/** His pages, newest first, and how many of his promises are late (never a card). */
export interface PagesList {
  readonly items: readonly Page[];
  readonly overdue: number;
}

/** A project's PR list (the prs event without its tag). */
export interface PrsList {
  readonly head: string;
  readonly items: readonly Pr[];
  /** the hub's words when none is open */
  readonly none: string | null;
}

export function typed(raw: unknown): Ev | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const tag = (raw as { ev?: unknown }).ev;
  if (typeof tag !== 'string' || !Object.hasOwn(TAGS, tag)) return null;
  return raw as Ev;
}

export const threadKey = (project: string, agent: string): string => `${project}/${agent}`;

/** The hub's yes/no question to this window (bar I9: archive a working agent...). */
export interface Confirm {
  readonly project: string;
  readonly id: number;
  readonly text: string;
}

/** The hub's last line to this window for a project: a plain line (a notice: /flow, a confirm's no) or an error (a refused slash line: his words to fix). */
export interface HubLine {
  readonly text: string;
  readonly level: 'note' | 'error';
}

/** His send, shown at once, until its 'you' entry lands (FIFO by text) or it fails. */
export interface Pending {
  readonly cid: number;
  readonly project: string;
  readonly agent: string;
  readonly text: string;
  readonly mode: Mode;
  /** files he attached (absolute paths), sent with his words */
  readonly files?: readonly string[];
  readonly at_ms: number;
  readonly state: 'sending' | 'failed';
  readonly why?: string;
}

/** A thread's list, as the list draws it: replaced only when its order, before or more change. */
export interface ThreadOrder {
  readonly order: readonly number[];
  readonly before: number | null;
  readonly more: boolean;
  /** a first page arrived */
  readonly loaded: boolean;
}

export type Diff = EvOf<'diff'>;
export type Away = EvOf<'away_summary'>;
/** An `@` query's answer (core/picks.rs, the TUI's files.rs ranking). */
export interface FilesAnswer {
  readonly q: string;
  readonly items: readonly PickFile[];
  /** the browsed folder's own row (`@src/`) */
  readonly folder: PickFolder | null;
  /** the workspace's first walk still runs: a fuller answer follows */
  readonly partial: boolean;
}

/**
 * A dictation (bar I): `text` is the whole text so far (replace the
 * composer's dictated part, never append); `final`: over (stopped, the time
 * limit, fn's talk, cancelled, or `error`: refused or failed).
 */
export interface Dictation {
  readonly text: string;
  readonly final: boolean;
  readonly cancelled: boolean;
  readonly error: string | null;
}
/** Voice mode's state (core/voice_mode.rs), only in the window that turned it on. */
export type VoiceModeState = EvOf<'voice_mode'>;
export type { AwayProject };

/** The listener key of a diff slice (hooks.ts subscribes with it). */
/** A tool call's output: its real lines and whether they were cut, or the hub's refusal. */
/** total: the whole output's bytes, only when the hub read the session log (amb-feed a928ab09). */
export type ToolOut = { readonly out: string; readonly cut: boolean; readonly total?: number } | { readonly error: string };

/** The slice key of one call's output (pos is the key: ToolItem.id repeats). Pure. */
/** A queued message taken back: its words, or the hub's refusal. */
export type QueuedTake = { readonly text: string } | { readonly error: string };

export function takeKey(project: string, agent: string, id: number): string {
  return `queued_taken:${project}/${agent}/${String(id)}`;
}

export function toolOutKey(project: string, agent: string, pos: number): string {
  return `tool_out:${project}/${agent}/${String(pos)}`;
}

export function diffKey(project: string, agent: string, commit?: string): string {
  return commit === undefined ? `diff:${project}/${agent}` : `diff:${project}/@${commit}`;
}

export function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function sameOrder(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * His words as sent, to match a pending send with its echo: the hub's image markers
 * (`<image name="[Image #1]" path=… mime=… b64=…>`, rust/images marker()) and the composer's
 * '[Image #n]' labels out, spaces collapsed. Pure.
 */
export function sentWords(text: string): string {
  return text
    .replace(/<image name="[^"]*" path="[^"]*" mime="[^"]*" b64="[^"]*">/g, ' ')
    .replace(/\[Image #\d+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
