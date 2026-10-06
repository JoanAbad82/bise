// The one store of bise desktop: fed by the core's typed events (bise-proto's
// HubEv | CoreEv, src/proto), read by React through hooks.ts. Pure: no React,
// no Electron; the core is a CorePort (window.bise.core, or a fake in tests).
//
// The rule it keeps (amb-win m_9478): a change re-renders only who reads it.
// Every slice has its own key and listeners; an object a slice gives out is
// replaced only when that slice changed, so useSyncExternalStore sees the
// same reference otherwise. A thread is a key `${project}/${agent}`: its
// order (positions), its entries by position (a `thread` page merges, an
// `entry` replaces only that entry), typing, and his pending sends.
//
// Unknown tags (a newer core, the capsule's older events) are ignored at
// runtime: only the tags of TAGS are applied, and TAGS is checked complete
// against the generated unions at compile time.
import type {
  Account,
  AwayProject,
  Card,
  CoreEv,
  Agent,
  Artifact,
  DevServer,
  Entry,
  Found,
  HubEv,
  Job,
  JsonValue,
  Merged,
  Mode,
  Plugin,
  ProjectRow,
  Worktree,
} from '@/proto';
import type { CoreCmd, CorePort, CoreState } from '@/shared/api';

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
  worktrees: true,
  dev_servers: true,
  merged: true,
  diff: true,
  route: true,
  route_done: true,
  jobs: true,
  job_end: true,
  error: true,
  projects: true,
  open: true,
  prefs: true,
  accounts: true,
  found: true,
  away_summary: true,
  plugins: true,
  computer_use: true,
} as const satisfies Record<Ev['ev'], true>;

/** A raw event from the core as a typed one, or null (not an object, or a tag the store doesn't know). */
export function typed(raw: unknown): Ev | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const tag = (raw as { ev?: unknown }).ev;
  if (typeof tag !== 'string' || !Object.hasOwn(TAGS, tag)) return null;
  return raw as Ev;
}

export const threadKey = (project: string, agent: string): string => `${project}/${agent}`;

/** His send, shown at once, until its 'you' entry lands (FIFO by text) or it fails. */
export interface Pending {
  readonly cid: number;
  readonly project: string;
  readonly agent: string;
  readonly text: string;
  readonly mode: Mode;
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
export type { AwayProject };

const EMPTY_ORDER: ThreadOrder = { order: [], before: null, more: false, loaded: false };
const EMPTY: readonly never[] = [];

interface Thread {
  view: ThreadOrder;
  byPos: Map<number, Entry>;
  typing: string;
  pending: readonly Pending[];
}

type Listener = () => void;

export interface StoreOptions {
  readonly now?: () => number;
}

export class Store {
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly threads = new Map<string, Thread>();
  private readonly slices = new Map<string, unknown>();
  private readonly evListeners = new Set<(ev: Ev) => void>();
  private coreState: CoreState = 'down';
  private cid = 0;
  /** the last shown set sent (null: none yet); said again to a core that comes back up */
  private shownSet: readonly string[] | null = null;
  private readonly now: () => number;

  constructor(
    private readonly port: Pick<CorePort, 'send'> | null = null,
    opts: StoreOptions = {},
  ) {
    this.now = opts.now ?? Date.now;
  }

  // ---- subscriptions

  subscribe(key: string, fn: Listener): () => void {
    let set = this.listeners.get(key);
    if (set === undefined) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  }

  /** Every applied event, after the store changed (one-shot things: open, route, job_end, error). */
  onEvent(fn: (ev: Ev) => void): () => void {
    this.evListeners.add(fn);
    return () => {
      this.evListeners.delete(fn);
    };
  }

  private emit(key: string): void {
    const set = this.listeners.get(key);
    if (set === undefined) return;
    for (const fn of [...set]) fn();
  }

  private put(key: string, value: unknown): void {
    this.slices.set(key, value);
    this.emit(key);
  }

  private slice<T>(key: string, empty: T): T {
    return (this.slices.get(key) as T | undefined) ?? empty;
  }

  // ---- reads (stable references between changes)

  projects(): readonly ProjectRow[] {
    return this.slice('projects', EMPTY);
  }
  agents(project: string): readonly Agent[] {
    return this.slice(`agents:${project}`, EMPTY);
  }
  /** The hub's cards when it sent them, else the projects row's. */
  cards(project: string): readonly Card[] {
    return this.slice(`cards:${project}`, EMPTY);
  }
  prefs(): JsonValue | null {
    return this.slice<JsonValue | null>('prefs', null);
  }
  accounts(): readonly Account[] {
    return this.slice('accounts', EMPTY);
  }
  found(): readonly Found[] {
    return this.slice('found', EMPTY);
  }
  /** computer use's state (P.2); null until the core sent it */
  computerUse(): EvOf<'computer_use'> | null {
    return this.slice<EvOf<'computer_use'> | null>('computer_use', null);
  }
  /** a workspace's agent plugins (none: bise's home's); null until the core sent them */
  plugins(project?: string): readonly Plugin[] | null {
    return this.slice<readonly Plugin[] | null>(`plugins:${project ?? ''}`, null);
  }
  artifacts(project: string): readonly Artifact[] {
    return this.slice(`artifacts:${project}`, EMPTY);
  }
  worktrees(project: string): readonly Worktree[] {
    return this.slice(`worktrees:${project}`, EMPTY);
  }
  devServers(project: string): readonly DevServer[] {
    return this.slice(`dev_servers:${project}`, EMPTY);
  }
  merged(project: string): readonly Merged[] {
    return this.slice(`merged:${project}`, EMPTY);
  }
  jobs(project: string): readonly Job[] {
    return this.slice(`jobs:${project}`, EMPTY);
  }
  /** The latest diff of an agent's change, or of one commit (`commit`). */
  diff(project: string, agent: string, commit?: string): Diff | null {
    return this.slice<Diff | null>(diffKey(project, agent, commit), null);
  }
  away(): Away | null {
    return this.slice<Away | null>('away', null);
  }
  core(): CoreState {
    return this.coreState;
  }
  threadOrder(key: string): ThreadOrder {
    return this.threads.get(key)?.view ?? EMPTY_ORDER;
  }
  entry(key: string, pos: number): Entry | undefined {
    return this.threads.get(key)?.byPos.get(pos);
  }
  typing(key: string): string {
    return this.threads.get(key)?.typing ?? '';
  }
  pending(key: string): readonly Pending[] {
    return this.threads.get(key)?.pending ?? EMPTY;
  }

  // ---- the core's events

  /** Applies one raw event from the core; false when it isn't one the store knows. */
  apply(raw: unknown): boolean {
    const ev = typed(raw);
    if (ev === null) return false;
    this.applyTyped(ev);
    for (const fn of [...this.evListeners]) fn(ev);
    return true;
  }

  private applyTyped(ev: Ev): void {
    switch (ev.ev) {
      case 'projects':
        this.put('projects', ev.projects);
        for (const row of ev.projects) {
          if (row.cards !== undefined && !this.slices.has(`hubcards:${row.project}`)) {
            this.put(`cards:${row.project}`, row.cards);
          }
        }
        return;
      case 'agents':
        this.put(`agents:${ev.project}`, ev.agents);
        return;
      case 'cards':
        this.slices.set(`hubcards:${ev.project}`, true);
        this.put(`cards:${ev.project}`, ev.cards);
        return;
      case 'thread':
        this.page(ev);
        return;
      case 'entry':
        this.entryEv(ev);
        return;
      case 'typing': {
        const key = threadKey(ev.project, ev.agent);
        const t = this.thread(key);
        if (t.typing === ev.text) return;
        t.typing = ev.text;
        this.emit(`typing:${key}`);
        return;
      }
      case 'artifacts':
      case 'worktrees':
      case 'dev_servers':
      case 'merged':
      case 'jobs':
        this.put(`${ev.ev}:${ev.project}`, ev.items);
        return;
      case 'diff':
        this.put(diffKey(ev.project, ev.agent, ev.commit ?? undefined), ev);
        return;
      case 'prefs':
        this.put('prefs', ev.prefs);
        return;
      case 'accounts':
        this.put('accounts', ev.items);
        return;
      case 'found':
        this.put('found', ev.items);
        return;
      case 'plugins':
        this.put(`plugins:${ev.project ?? ''}`, ev.items);
        return;
      case 'computer_use':
        this.put('computer_use', ev);
        return;
      case 'away_summary':
        this.put('away', ev);
        return;
      case 'error':
        if (ev.cmd === 'send') this.failOldest(ev.project ?? null, ev.text);
        return;
      case 'welcome':
      case 'route':
      case 'route_done':
      case 'job_end':
      case 'open':
        // one-shot: read through onEvent
        return;
    }
  }

  /** The core went up or down: down fails every send still on its way ('not sent · retry'). */
  setCore(state: CoreState): void {
    if (state === this.coreState) return;
    this.coreState = state;
    this.emit('core');
    // a new core knows nothing of the window: what it shows is said again
    if (state === 'up' && this.shownSet !== null) this.command({ cmd: 'shown', projects: [...this.shownSet] });
    if (state !== 'down') return;
    for (const [key, t] of this.threads) {
      if (!t.pending.some((p) => p.state === 'sending')) continue;
      t.pending = t.pending.map((p) => (p.state === 'sending' ? { ...p, state: 'failed', why: 'not sent' } : p));
      this.emit(`pending:${key}`);
    }
  }

  private thread(key: string): Thread {
    let t = this.threads.get(key);
    if (t === undefined) {
      t = { view: EMPTY_ORDER, byPos: new Map(), typing: '', pending: EMPTY };
      this.threads.set(key, t);
    }
    return t;
  }

  private setOrder(key: string, t: Thread, order: readonly number[], before: number | null, more: boolean): void {
    const v = t.view;
    if (v.loaded && v.before === before && v.more === more && sameOrder(v.order, order)) return;
    t.view = { order, before, more, loaded: true };
    this.emit(`order:${key}`);
  }

  private page(ev: EvOf<'thread'>): void {
    const key = threadKey(ev.project, ev.agent);
    const t = this.thread(key);
    for (const e of ev.entries) this.putEntry(key, t, e);
    const all = new Set(t.view.order);
    for (const e of ev.entries) all.add(e.pos);
    const order = [...all].sort((a, b) => a - b);
    // a page of older entries keeps the newer ones; its before/more are the oldest page's
    const oldest = ev.entries.length === 0 || (t.view.order.length > 0 && (ev.entries[0]?.pos ?? 0) < (t.view.order[0] ?? 0));
    const fresh = !t.view.loaded;
    const before = fresh || oldest ? ev.before : t.view.before;
    const more = fresh || oldest ? ev.more : t.view.more;
    this.setOrder(key, t, order, before, more);
  }

  private entryEv(ev: EvOf<'entry'>): void {
    const key = threadKey(ev.project, ev.agent);
    const t = this.thread(key);
    const known = t.byPos.has(ev.entry.pos);
    this.putEntry(key, t, ev.entry);
    if (!known) {
      const order = [...t.view.order, ev.entry.pos].sort((a, b) => a - b);
      this.setOrder(key, t, order, t.view.before, t.view.more);
    }
    if (ev.entry.kind === 'you') this.landed(key, t, ev.entry.text);
  }

  private putEntry(key: string, t: Thread, e: Entry): void {
    const old = t.byPos.get(e.pos);
    if (old !== undefined && sameJson(old, e)) return;
    t.byPos.set(e.pos, e);
    this.emit(`entry:${key}:${String(e.pos)}`);
  }

  /** His words landed in the thread: the oldest pending send with these words goes. */
  private landed(key: string, t: Thread, text: string): void {
    const i = t.pending.findIndex((p) => p.text.trim() === text.trim());
    if (i < 0) return;
    t.pending = t.pending.filter((_, j) => j !== i);
    this.emit(`pending:${key}`);
  }

  private failOldest(project: string | null, why: string): void {
    let oldest: { key: string; t: Thread; p: Pending } | null = null;
    for (const [key, t] of this.threads) {
      for (const p of t.pending) {
        if (p.state !== 'sending' || (project !== null && p.project !== project)) continue;
        if (oldest === null || p.cid < oldest.p.cid) oldest = { key, t, p };
      }
    }
    if (oldest === null) return;
    const { key, t, p } = oldest;
    t.pending = t.pending.map((x) => (x.cid === p.cid ? { ...x, state: 'failed', why } : x));
    this.emit(`pending:${key}`);
  }

  // ---- actions (typed commands to the core)

  command(cmd: CoreCmd): void {
    this.port?.send(cmd);
  }

  /** His words to an agent: shown at once as pending, then sent. Returns its cid. */
  send(a: { project: string; agent: string; text: string; mode?: Mode }): number {
    const key = threadKey(a.project, a.agent);
    const t = this.thread(key);
    this.cid += 1;
    const mode = a.mode ?? 'now';
    const p: Pending = { cid: this.cid, project: a.project, agent: a.agent, text: a.text, mode, at_ms: this.now(), state: 'sending' };
    t.pending = [...t.pending, p];
    this.emit(`pending:${key}`);
    if (this.coreState === 'down') {
      this.failOldest(a.project, 'not sent');
      return p.cid;
    }
    this.command({ cmd: 'send', project: a.project, agent: a.agent, text: a.text, mode });
    return p.cid;
  }

  /** A failed send goes again (same words, same mode), as a new pending row. */
  retry(key: string, cid: number): void {
    const t = this.threads.get(key);
    const p = t?.pending.find((x) => x.cid === cid && x.state === 'failed');
    if (t === undefined || p === undefined) return;
    t.pending = t.pending.filter((x) => x.cid !== cid);
    this.emit(`pending:${key}`);
    this.send({ project: p.project, agent: p.agent, text: p.text, mode: p.mode });
  }

  /** Drops a failed send (he gave up on it). */
  dismiss(key: string, cid: number): void {
    const t = this.threads.get(key);
    if (t === undefined || !t.pending.some((x) => x.cid === cid)) return;
    t.pending = t.pending.filter((x) => x.cid !== cid);
    this.emit(`pending:${key}`);
  }

  /**
   * The projects the window shows now (on load and each route change, amb-win
   * m_9717): the core holds their hubs and sends their rows, agents and cards
   * only after the first one. Sent only when the set changed.
   */
  shown(projects: readonly string[]): void {
    const set = [...new Set(projects)];
    if (this.shownSet !== null && sameStrings(this.shownSet, set)) return;
    this.shownSet = set;
    this.command({ cmd: 'shown', projects: set });
  }

  subscribeThread(project: string, agent: string, limit?: number): void {
    this.command({ cmd: 'subscribe', project, agent, ...(limit === undefined ? {} : { limit }) });
  }
  unsubscribeThread(project: string, agent: string): void {
    this.command({ cmd: 'unsubscribe', project, agent });
  }
  /** The page before the oldest entry held (nothing when there is no more). */
  olderPage(project: string, agent: string, limit?: number): void {
    const v = this.threadOrder(threadKey(project, agent));
    if (!v.more || v.before === null) return;
    this.command({ cmd: 'page', project, agent, before: v.before, ...(limit === undefined ? {} : { limit }) });
  }
  answer(project: string, card: number, reply: string): void {
    this.command({ cmd: 'answer', project, card, reply });
  }
  stop(project: string, agent: string): void {
    this.command({ cmd: 'stop', project, agent });
  }
}

/** The listener key of a diff slice (hooks.ts subscribes with it). */
export function diffKey(project: string, agent: string, commit?: string): string {
  return commit === undefined ? `diff:${project}/${agent}` : `diff:${project}/@${commit}`;
}

function sameStrings(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function sameOrder(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
